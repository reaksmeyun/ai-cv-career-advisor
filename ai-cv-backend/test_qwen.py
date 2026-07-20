from __future__ import annotations

import json
import re
from typing import Any

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"

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


def load_model():
    print("Loading tokenizer...")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    print("Loading model...")

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float32,
        device_map="cpu",
    )

    model.eval()

    return tokenizer, model


def build_prompt(cv_text: str) -> str:
    return f"""
You are a strict CV analysis assistant for students, interns, apprentices,
and junior job applicants.

Analyze only the information explicitly written in the CV.

Return valid JSON using exactly this structure:

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

1. Do not invent skills, experience, education, projects, or achievements.
2. Technical skills must be explicitly mentioned in the CV.
3. Soft skills must be supported by activities explicitly mentioned in the CV.
4. Do not include a skill in both softSkills and missingSkills.
5. Recommend exactly three different realistic roles.
6. Roles must be suitable for a student, intern, apprentice, entry-level, or junior candidate.
7. Do not recommend senior, lead, manager, architect, or specialist positions.
8. matchingSkills must come from technicalSkills or softSkills.
9. missingSkills must not already appear in technicalSkills or softSkills.
10. Missing skills should be role-relevant skills that would strengthen the candidate.
11. Learning recommendations must be practical actions, not generic bootcamp advertisements.
12. Keep the professional summary under 80 words.
13. Use third-person language such as "The candidate", not first-person language.
14. Return JSON only.
15. Do not use Markdown or code fences.

CV TEXT:
{cv_text}
""".strip()


def extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()

    cleaned = re.sub(
        r"^```json\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"^```\s*",
        "",
        cleaned,
    )
    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
    )

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "The model response does not contain a valid JSON object."
        )

    json_text = cleaned[start : end + 1]

    return json.loads(json_text)


def normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    output: list[str] = []
    seen: set[str] = set()

    for item in value:
        if not isinstance(item, str):
            continue

        cleaned = item.strip()

        if not cleaned:
            continue

        key = cleaned.lower()

        if key in seen:
            continue

        seen.add(key)
        output.append(cleaned)

    return output


def validate_analysis(result: dict[str, Any]) -> dict[str, Any]:
    required_fields = {
        "professionalSummary",
        "profileLevel",
        "technicalSkills",
        "softSkills",
        "recommendedRoles",
        "missingSkills",
        "learningRecommendations",
    }

    missing_fields = required_fields - result.keys()

    if missing_fields:
        raise ValueError(
            f"Missing required fields: {sorted(missing_fields)}"
        )

    professional_summary = result.get(
        "professionalSummary",
        "",
    )

    if not isinstance(professional_summary, str):
        professional_summary = ""

    result["professionalSummary"] = professional_summary.strip()

    profile_level = result.get("profileLevel")

    if profile_level not in ALLOWED_PROFILE_LEVELS:
        result["profileLevel"] = "Entry Level"

    technical_skills = normalize_string_list(
        result.get("technicalSkills")
    )

    soft_skills = normalize_string_list(
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

    result["technicalSkills"] = technical_skills
    result["softSkills"] = soft_skills

    existing_skills = {
        skill.lower()
        for skill in technical_skills + soft_skills
    }

    roles = result.get("recommendedRoles")

    if not isinstance(roles, list):
        raise ValueError(
            "recommendedRoles must be a list."
        )

    if len(roles) != 3:
        raise ValueError(
            "recommendedRoles must contain exactly three roles."
        )

    cleaned_roles: list[dict[str, Any]] = []
    role_titles: set[str] = set()

    for role in roles:
        if not isinstance(role, dict):
            continue

        title = str(role.get("title", "")).strip()

        if not title:
            continue

        title_key = title.lower()

        if title_key in role_titles:
            continue

        role_titles.add(title_key)

        match_level = role.get("matchLevel")

        if match_level not in ALLOWED_MATCH_LEVELS:
            match_level = "Developing"

        reason = str(role.get("reason", "")).strip()

        matching_skills = normalize_string_list(
            role.get("matchingSkills")
        )

        matching_skills = [
            skill
            for skill in matching_skills
            if skill.lower() in existing_skills
        ]

        missing_skills = normalize_string_list(
            role.get("missingSkills")
        )

        missing_skills = [
            skill
            for skill in missing_skills
            if skill.lower() not in existing_skills
        ]

        cleaned_roles.append(
            {
                "title": title,
                "matchLevel": match_level,
                "reason": reason,
                "matchingSkills": matching_skills,
                "missingSkills": missing_skills,
            }
        )

    if len(cleaned_roles) != 3:
        raise ValueError(
            "The model did not produce three unique valid roles."
        )

    result["recommendedRoles"] = cleaned_roles

    missing_skills_items = result.get("missingSkills")

    if not isinstance(missing_skills_items, list):
        missing_skills_items = []

    cleaned_missing_skills: list[dict[str, str]] = []
    seen_missing_skills: set[str] = set()

    for item in missing_skills_items:
        if not isinstance(item, dict):
            continue

        skill = str(item.get("skill", "")).strip()

        if not skill:
            continue

        skill_key = skill.lower()

        if skill_key in existing_skills:
            continue

        if skill_key in seen_missing_skills:
            continue

        seen_missing_skills.add(skill_key)

        priority = item.get("priority")

        if priority not in ALLOWED_PRIORITIES:
            priority = "Medium"

        reason = str(item.get("reason", "")).strip()
        action = str(item.get("action", "")).strip()

        cleaned_missing_skills.append(
            {
                "skill": skill,
                "priority": priority,
                "reason": reason,
                "action": action,
            }
        )

    result["missingSkills"] = cleaned_missing_skills

    recommendation_items = result.get(
        "learningRecommendations"
    )

    if not isinstance(recommendation_items, list):
        recommendation_items = []

    cleaned_recommendations: list[dict[str, str]] = []
    seen_recommendations: set[str] = set()

    for item in recommendation_items:
        if not isinstance(item, dict):
            continue

        title = str(item.get("title", "")).strip()

        if not title:
            continue

        title_key = title.lower()

        if title_key in seen_recommendations:
            continue

        seen_recommendations.add(title_key)

        level = item.get("level")

        if level not in ALLOWED_LEARNING_LEVELS:
            level = "Beginner"

        reason = str(item.get("reason", "")).strip()
        action = str(item.get("action", "")).strip()

        cleaned_recommendations.append(
            {
                "title": title,
                "level": level,
                "reason": reason,
                "action": action,
            }
        )

    result["learningRecommendations"] = cleaned_recommendations

    return result


def analyze_cv(
    tokenizer,
    model,
    cv_text: str,
) -> dict[str, Any]:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a strict CV analysis assistant. "
                "Return structured JSON only and never invent facts."
            ),
        },
        {
            "role": "user",
            "content": build_prompt(cv_text),
        },
    ]

    formatted_prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(
        formatted_prompt,
        return_tensors="pt",
        truncation=True,
        max_length=6000,
    )

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=700,
            do_sample=False,
            repetition_penalty=1.12,
            no_repeat_ngram_size=3,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_ids = output_ids[0][
        inputs["input_ids"].shape[1] :
    ]

    response = tokenizer.decode(
        generated_ids,
        skip_special_tokens=True,
    )

    print("\nRaw model response:\n")
    print(response)

    parsed_result = extract_json(response)
    validated_result = validate_analysis(parsed_result)

    return validated_result


def main() -> None:
    sample_cv = """
I am a fourth-year Software Engineering student.

I have experience building responsive web applications using JavaScript,
TypeScript, React, Next.js, Tailwind CSS, PostgreSQL, Supabase, Git,
GitHub, Docker, and REST APIs.

I developed a drag-and-drop content management system using Next.js,
TypeScript, PostgreSQL, Supabase, and Drizzle ORM.

I contributed to a university management system frontend. I participated
in user acceptance testing, documentation, issue reporting, teamwork,
and technical presentations.

I also helped integrate an AI movie recommendation chatbot with a web
application and database.

I am interested in frontend development, full-stack development, and
software developer apprentice opportunities.
""".strip()

    tokenizer, model = load_model()

    try:
        result = analyze_cv(
            tokenizer=tokenizer,
            model=model,
            cv_text=sample_cv,
        )

        print("\nValidated JSON result:\n")
        print(
            json.dumps(
                result,
                indent=2,
                ensure_ascii=False,
            )
        )

    except json.JSONDecodeError as error:
        print("\nJSON parsing failed:")
        print(error)

    except ValueError as error:
        print("\nValidation failed:")
        print(error)

    except KeyboardInterrupt:
        print("\nProcess cancelled by user.")

    except Exception as error:
        print("\nAnalysis failed:")
        print(type(error).__name__, error)


if __name__ == "__main__":
    main()