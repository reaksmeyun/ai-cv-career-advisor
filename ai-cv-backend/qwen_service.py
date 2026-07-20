from __future__ import annotations

import json
import os
import re
import threading
from typing import Any

import json_repair
from llama_cpp import Llama

from schemas import CVAnalysis


# GGUF (llama.cpp) model: Q4_K_M is ~1GB (vs ~3.6GB bf16) and faster on CPU.
MODEL_REPO = "Qwen/Qwen2.5-1.5B-Instruct-GGUF"
MODEL_FILE = "qwen2.5-1.5b-instruct-q4_k_m.gguf"
MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct (GGUF Q4_K_M)"

# Context window for llama.cpp (input prompt + generated tokens).
N_CTX = 4096

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

# Token budget: enough for the full JSON (summary + 3 roles + skills + missing
# skills + learning recs), but capped so CPU generation stays fast and within
# memory. Generation time scales with this number, so keep it tight.
MAX_NEW_TOKENS = 900

# Bounded retries so malformed model output gets a few chances without ever
# looping forever. Later attempts sample (vary output) instead of repeating
# the same greedy result.
MAX_ATTEMPTS = 3


class QwenCVService:
    def __init__(self) -> None:
        self.model_name = MODEL_NAME
        self.device = "cpu"
        self._lock = threading.Lock()

        print("Loading Qwen GGUF model via llama.cpp...")

        # from_pretrained downloads + caches the GGUF on first run (~1GB).
        self.llm = Llama.from_pretrained(
            repo_id=MODEL_REPO,
            filename=MODEL_FILE,
            n_ctx=N_CTX,
            n_threads=os.cpu_count() or 4,
            verbose=False,
        )

        print("Qwen model is ready.")

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
2. Technical skills must be explicitly mentioned in the CV.
3. Soft skills must be supported by activities in the CV.
4. Do not place one skill in both detected skills and missing skills.
5. Recommend exactly three different realistic roles.
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
        end = cleaned.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise ValueError(
                "The model did not return a JSON object."
            )

        json_text = cleaned[start : end + 1]

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

        if len(cleaned_roles) < 3:
            raise ValueError(
                "The model must produce at least three unique roles."
            )

        # The contract is exactly three; keep the first three if more.
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

        params: dict[str, Any] = {
            "messages": messages,
            "max_tokens": MAX_NEW_TOKENS,
            "repeat_penalty": 1.12,
            # Grammar-constrain the output to a valid JSON object, which removes
            # the malformed-JSON failure class (quotes, commas, comments, etc.).
            "response_format": {"type": "json_object"},
        }

        if do_sample:
            # Vary the output so a retry can escape a bad result.
            params.update(temperature=0.5, top_p=0.9)
        else:
            params.update(temperature=0.0)

        # Prevent two CPU-heavy generations from running together.
        with self._lock:
            output = self.llm.create_chat_completion(**params)

        return output["choices"][0]["message"].get("content") or ""

    def analyze(self, cv_text: str) -> CVAnalysis:
        cleaned_cv = cv_text.strip()

        if len(cleaned_cv) < 100:
            raise ValueError(
                "CV text must contain at least 100 characters."
            )

        if len(cleaned_cv) > 12_000:
            cleaned_cv = cleaned_cv[:12_000]

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