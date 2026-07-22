from __future__ import annotations

import json
import os
import re
import threading
from typing import Any

import json_repair
from huggingface_hub import InferenceClient

from schemas import CVAnalysis


# Remote inference via Hugging Face Inference Providers. No local model weights
# are loaded — the heavy work runs on Hugging Face's infrastructure, so this
# backend stays lightweight and starts instantly.
DEFAULT_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
MODEL_ID = os.getenv("MODEL_ID", DEFAULT_MODEL_ID)
MODEL_NAME = MODEL_ID  # exported for callers / health endpoint


class ModelServiceError(Exception):
    """A user-safe remote-inference failure. `code` maps to an HTTP status."""

    def __init__(self, message: str, code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.code = code

ALLOWED_PROFILE_LEVELS = {
    "Student",
    "Internship Level",
    "Apprentice Level",
    "Entry Level",
    "Junior Level",
}

ALLOWED_MATCH_LEVELS = {
    "High",
    "Medium",
    "Developing",
}

ALLOWED_PRIORITIES = {
    "High",
    "Medium",
    "Low",
}

ALLOWED_LEARNING_LEVELS = {
    "Beginner",
    "Intermediate",
    "Advanced",
}

# Output token budget for the JSON analysis.
MAX_NEW_TOKENS = 1200

# CV text bounds enforced by the service (the request schema also validates).
MIN_CV_CHARS = 50
MAX_CV_CHARS = 20_000

# Bounded retries so malformed model output gets a few chances without ever
# looping forever. Later attempts sample (vary output) for a different result.
MAX_ATTEMPTS = 3

# Generic, realistic entry-level roles used only to pad up to three when the
# model returns one or two usable roles, so a valid analysis is never rejected
# purely on role count. Real model roles always come first.
FALLBACK_ROLES: list[dict[str, Any]] = [
    {
        "title": "Junior Software Developer",
        "matchLevel": "Developing",
        "reason": "A broad entry-level software role suited to a developing skill set.",
        "matchingSkills": [],
        "missingSkills": [],
    },
    {
        "title": "Software Development Intern",
        "matchLevel": "Developing",
        "reason": "An internship to build practical, hands-on experience across the stack.",
        "matchingSkills": [],
        "missingSkills": [],
    },
    {
        "title": "QA / Software Testing Associate",
        "matchLevel": "Developing",
        "reason": "An accessible entry point that values attention to detail and testing.",
        "matchingSkills": [],
        "missingSkills": [],
    },
]


class QwenCVService:
    def __init__(self) -> None:
        self.model_id = MODEL_ID
        self.model_name = MODEL_NAME
        self._lock = threading.Lock()
        self._client: InferenceClient | None = None
        # No model is loaded here — inference is remote. The client is created
        # lazily on first use so the app starts fine even without HF_TOKEN.

    @staticmethod
    def token_configured() -> bool:
        return bool(os.getenv("HF_TOKEN"))

    def _get_client(self) -> InferenceClient:
        token = os.getenv("HF_TOKEN")
        if not token:
            raise ModelServiceError(
                "The analysis service is not configured. Please try again later.",
                code=502,
            )
        if self._client is None:
            self._client = InferenceClient(api_key=token, provider="auto")
        return self._client

    def build_prompt(self, cv_text: str) -> str:
        return f"""
You are a strict CV analysis assistant for students, interns,
apprentices, and junior job applicants.

Analyze only information explicitly supported by the CV.

Return valid JSON with exactly this structure:

{{
  "professionalSummary": "string",
  "profileLevel": "Student, Internship Level, Apprentice Level, Entry Level, or Junior Level",
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "recommendedRoles": [
    {{
      "title": "string",
      "matchLevel": "High, Medium, or Developing",
      "reason": "string",
      "matchingSkills": ["string"],
      "missingSkills": ["string"]
    }}
  ],
  "missingSkills": [
    {{
      "skill": "string",
      "priority": "High, Medium, or Low",
      "reason": "string",
      "action": "string"
    }}
  ],
  "learningRecommendations": [
    {{
      "title": "string",
      "level": "Beginner, Intermediate, or Advanced",
      "reason": "string",
      "action": "string"
    }}
  ]
}}

Strict rules:

1. Never invent education, skills, projects, experience, or achievements.
2. Technical skills must be explicitly mentioned in the CV, listed as SHORT
   individual terms (e.g. "Python", "React", "Docker") — never sentences,
   never category labels, never several skills inside one string.
3. Soft skills must be SHORT labels (e.g. "Teamwork", "Communication"),
   supported by activities in the CV — never full sentences.
4. Do not place one skill in both detected skills and missing skills.
5. recommendedRoles MUST contain exactly three different, distinct roles.
6. Recommend only student, internship, apprentice, entry-level, or junior roles.
7. Never recommend senior, lead, manager, architect, or executive positions.
8. Each matching skill must be present in technicalSkills or softSkills.
9. Each missing skill must not already be present in the detected skills.
10. Missing skills should be relevant to a recommended role.
11. Learning recommendations must be specific and practical.
12. Do not advertise generic bootcamps.
13. Keep the professional summary below 60 words.
14. Keep every reason and action to one short sentence (max 20 words).
15. Provide at most 5 missing skills and at most 4 learning recommendations.
16. Use third-person wording such as "The candidate".
17. Return JSON only.
18. Do not use Markdown or code fences.

CV TEXT:
{cv_text}
""".strip()

    @staticmethod
    def extract_json(text: str) -> dict[str, Any]:
        cleaned = text.strip()

        cleaned = re.sub(
            r"^```json\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        start = cleaned.find("{")

        if start == -1:
            raise ValueError(
                "The model did not return a JSON object."
            )

        end = cleaned.rfind("}")

        # If the output was truncated (no closing brace), keep everything from
        # the first "{" and let json_repair close it below.
        json_text = cleaned[start : end + 1] if end > start else cleaned[start:]

        # LLMs frequently emit trailing commas, which are invalid JSON.
        json_text = re.sub(r",(\s*[}\]])", r"\1", json_text)

        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            # Small models often emit almost-JSON (single quotes, unquoted keys,
            # missing commas). Repair it rather than failing the whole attempt.
            repaired = json_repair.loads(json_text)

            if not isinstance(repaired, dict):
                raise ValueError(
                    "The model output could not be repaired into a JSON object."
                )

            return repaired

    # Small models often mangle the exact JSON key names. These maps let us
    # recover the intended field from common variants/typos.
    TOP_KEY_ALIASES = {
        "professionalsummary": "professionalSummary",
        "summary": "professionalSummary",
        "profilelevel": "profileLevel",
        "profilerole": "profileLevel",
        "profile": "profileLevel",
        "level": "profileLevel",
        "technicalskills": "technicalSkills",
        "techskills": "technicalSkills",
        "hardskills": "technicalSkills",
        "skills": "technicalSkills",
        "softskills": "softSkills",
        "recommendedroles": "recommendedRoles",
        "recommendation": "recommendedRoles",
        "recommendations": "recommendedRoles",
        "roles": "recommendedRoles",
        "missingskills": "missingSkills",
        "skillgaps": "missingSkills",
        "gaps": "missingSkills",
        "learningrecommendations": "learningRecommendations",
        "learning": "learningRecommendations",
        "learnings": "learningRecommendations",
        "recommendationsforlearning": "learningRecommendations",
    }

    ROLE_KEY_ALIASES = {
        "title": "title",
        "role": "title",
        "roletitle": "title",
        "name": "title",
        "matchlevel": "matchLevel",
        "match": "matchLevel",
        "reason": "reason",
        "explanation": "reason",
        "why": "reason",
        "matchingskills": "matchingSkills",
        "matching": "matchingSkills",
        "missingskills": "missingSkills",
        "missing": "missingSkills",
        "gaps": "missingSkills",
    }

    MISSING_KEY_ALIASES = {
        "skill": "skill",
        "name": "skill",
        "priority": "priority",
        "reason": "reason",
        "why": "reason",
        "action": "action",
        "suggestedaction": "action",
        "suggestion": "action",
    }

    LEARNING_KEY_ALIASES = {
        "title": "title",
        "name": "title",
        "level": "level",
        "reason": "reason",
        "why": "reason",
        "action": "action",
        "suggestedaction": "action",
        "suggestion": "action",
    }

    @staticmethod
    def canonicalize_keys(
        value: Any,
        aliases: dict[str, str],
    ) -> dict[str, Any]:
        if not isinstance(value, dict):
            return {}

        output: dict[str, Any] = {}

        for key, item in value.items():
            normalized = re.sub(r"[^a-z0-9]", "", str(key).lower())
            canonical = aliases.get(normalized, key)

            # Prefer the first value seen for a canonical key.
            if canonical not in output:
                output[canonical] = item

        return output

    @staticmethod
    def normalize_string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []

        output: list[str] = []
        seen: set[str] = set()

        for item in value:
            if not isinstance(item, str):
                continue

            cleaned = item.strip()
            key = cleaned.lower()

            if not cleaned or key in seen:
                continue

            seen.add(key)
            output.append(cleaned)

        return output

    def validate_and_clean(
        self,
        result: dict[str, Any],
    ) -> CVAnalysis:
        # Recover intended field names before checking required fields.
        result = self.canonicalize_keys(result, self.TOP_KEY_ALIASES)

        if isinstance(result.get("recommendedRoles"), list):
            result["recommendedRoles"] = [
                self.canonicalize_keys(role, self.ROLE_KEY_ALIASES)
                for role in result["recommendedRoles"]
                if isinstance(role, dict)
            ]

        if isinstance(result.get("missingSkills"), list):
            result["missingSkills"] = [
                self.canonicalize_keys(item, self.MISSING_KEY_ALIASES)
                for item in result["missingSkills"]
                if isinstance(item, dict)
            ]

        if isinstance(result.get("learningRecommendations"), list):
            result["learningRecommendations"] = [
                self.canonicalize_keys(item, self.LEARNING_KEY_ALIASES)
                for item in result["learningRecommendations"]
                if isinstance(item, dict)
            ]

        # Only these are truly essential. Every other field safely defaults
        # (empty list, or "Entry Level" for profileLevel), so requiring them
        # would reject otherwise-usable analyses from a small model.
        required_fields = {
            "professionalSummary",
            "recommendedRoles",
        }

        missing_fields = required_fields - result.keys()

        if missing_fields:
            raise ValueError(
                f"Missing AI response fields: {sorted(missing_fields)}"
            )

        summary = str(
            result.get("professionalSummary", "")
        ).strip()

        if not summary:
            raise ValueError(
                "The professional summary is empty."
            )

        profile_level = result.get("profileLevel")

        if profile_level not in ALLOWED_PROFILE_LEVELS:
            profile_level = "Entry Level"

        technical_skills = self.normalize_string_list(
            result.get("technicalSkills")
        )

        soft_skills = self.normalize_string_list(
            result.get("softSkills")
        )

        technical_keys = {
            skill.lower()
            for skill in technical_skills
        }

        soft_skills = [
            skill
            for skill in soft_skills
            if skill.lower() not in technical_keys
        ]

        existing_skills = {
            skill.lower()
            for skill in technical_skills + soft_skills
        }

        raw_roles = result.get("recommendedRoles")

        if not isinstance(raw_roles, list):
            raise ValueError(
                "recommendedRoles must be a list."
            )

        cleaned_roles: list[dict[str, Any]] = []
        role_titles: set[str] = set()

        for role in raw_roles:
            if not isinstance(role, dict):
                continue

            title = str(role.get("title", "")).strip()
            title_key = title.lower()

            if not title or title_key in role_titles:
                continue

            role_titles.add(title_key)

            match_level = role.get("matchLevel")

            if match_level not in ALLOWED_MATCH_LEVELS:
                match_level = "Developing"

            matching_skills = self.normalize_string_list(
                role.get("matchingSkills")
            )

            matching_skills = [
                skill
                for skill in matching_skills
                if skill.lower() in existing_skills
            ]

            role_missing = self.normalize_string_list(
                role.get("missingSkills")
            )

            role_missing = [
                skill
                for skill in role_missing
                if skill.lower() not in existing_skills
            ]

            cleaned_roles.append(
                {
                    "title": title,
                    "matchLevel": match_level,
                    "reason": str(
                        role.get("reason", "")
                    ).strip(),
                    "matchingSkills": matching_skills,
                    "missingSkills": role_missing,
                }
            )

        if len(cleaned_roles) == 0:
            raise ValueError(
                "The model did not produce any usable roles."
            )

        # Pad up to three with generic entry-level roles if the model returned
        # fewer, so a usable analysis is never rejected purely on role count.
        for fallback in FALLBACK_ROLES:
            if len(cleaned_roles) >= 3:
                break
            if fallback["title"].lower() not in role_titles:
                role_titles.add(fallback["title"].lower())
                cleaned_roles.append(dict(fallback))

        # The contract is exactly three; keep the first three.
        cleaned_roles = cleaned_roles[:3]

        cleaned_missing: list[dict[str, str]] = []
        seen_missing: set[str] = set()

        raw_missing = result.get("missingSkills", [])

        if not isinstance(raw_missing, list):
            raw_missing = []

        for item in raw_missing:
            if not isinstance(item, dict):
                continue

            skill = str(item.get("skill", "")).strip()
            skill_key = skill.lower()

            if (
                not skill
                or skill_key in existing_skills
                or skill_key in seen_missing
            ):
                continue

            seen_missing.add(skill_key)

            priority = item.get("priority")

            if priority not in ALLOWED_PRIORITIES:
                priority = "Medium"

            cleaned_missing.append(
                {
                    "skill": skill,
                    "priority": priority,
                    "reason": str(
                        item.get("reason", "")
                    ).strip(),
                    "action": str(
                        item.get("action", "")
                    ).strip(),
                }
            )

        cleaned_recommendations: list[dict[str, str]] = []
        seen_recommendations: set[str] = set()

        raw_recommendations = result.get(
            "learningRecommendations",
            [],
        )

        if not isinstance(raw_recommendations, list):
            raw_recommendations = []

        for item in raw_recommendations:
            if not isinstance(item, dict):
                continue

            title = str(item.get("title", "")).strip()
            title_key = title.lower()

            if (
                not title
                or title_key in seen_recommendations
            ):
                continue

            seen_recommendations.add(title_key)

            level = item.get("level")

            if level not in ALLOWED_LEARNING_LEVELS:
                level = "Beginner"

            cleaned_recommendations.append(
                {
                    "title": title,
                    "level": level,
                    "reason": str(
                        item.get("reason", "")
                    ).strip(),
                    "action": str(
                        item.get("action", "")
                    ).strip(),
                }
            )

        cleaned_result = {
            "professionalSummary": summary,
            "profileLevel": profile_level,
            "technicalSkills": technical_skills,
            "softSkills": soft_skills,
            "recommendedRoles": cleaned_roles,
            "missingSkills": cleaned_missing,
            "learningRecommendations": (
                cleaned_recommendations
            ),
        }

        return CVAnalysis.model_validate(cleaned_result)

    def _generate_once(
        self,
        cleaned_cv: str,
        do_sample: bool,
    ) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You analyze CVs objectively. "
                    "Return valid JSON only and never invent facts."
                ),
            },
            {
                "role": "user",
                "content": self.build_prompt(cleaned_cv),
            },
        ]

        client = self._get_client()

        # Low temperature for stable JSON; retries nudge it up for variety.
        temperature = 0.5 if do_sample else 0.2

        try:
            with self._lock:
                completion = client.chat_completion(
                    model=self.model_id,
                    messages=messages,
                    max_tokens=MAX_NEW_TOKENS,
                    temperature=temperature,
                )
        except ModelServiceError:
            raise
        except Exception as error:  # provider / network / unavailable model
            raise ModelServiceError(
                "The analysis provider is currently unavailable. Please try again.",
                code=502,
            ) from error

        try:
            content = completion.choices[0].message.content
        except (AttributeError, IndexError, KeyError, TypeError):
            content = None

        if not content or not content.strip():
            raise ModelServiceError(
                "The model returned an empty response. Please try again.",
                code=502,
            )

        return content

    def analyze(self, cv_text: str) -> CVAnalysis:
        cleaned_cv = cv_text.strip()

        if len(cleaned_cv) < MIN_CV_CHARS:
            raise ValueError(
                f"CV text must contain at least {MIN_CV_CHARS} characters."
            )

        if len(cleaned_cv) > MAX_CV_CHARS:
            cleaned_cv = cleaned_cv[:MAX_CV_CHARS]

        last_error: Exception | None = None

        for attempt in range(MAX_ATTEMPTS):
            response = ""
            try:
                # First attempt is greedy (deterministic); retries sample.
                response = self._generate_once(
                    cleaned_cv,
                    do_sample=attempt > 0,
                )

                parsed = self.extract_json(response)

                return self.validate_and_clean(parsed)

            except (ValueError, json.JSONDecodeError) as error:
                last_error = error

                print(
                    f"Analysis attempt {attempt + 1} of "
                    f"{MAX_ATTEMPTS} failed:",
                    type(error).__name__,
                    error,
                )
                print("--- raw model output (first 700 chars) ---")
                print(response[:700])
                print("--- end raw output ---")

        raise ValueError(
            "The AI could not produce a valid analysis after "
            f"{MAX_ATTEMPTS} attempts. Please try again. "
            f"Last error: {last_error}"
        )


qwen_service = QwenCVService()