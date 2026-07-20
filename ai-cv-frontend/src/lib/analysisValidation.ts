import {
  MATCH_LEVELS,
  PRIORITIES,
  SKILL_LEVELS,
  type CareerAnalysis,
  type LearningRecommendation,
  type MissingSkill,
  type RecommendedRole,
  type SoftSkill,
  type SuggestedProject,
} from "@/types/analysis";

/** Number of recommended roles the analysis must always contain. */
export const REQUIRED_ROLE_COUNT = 3;

export type AnalysisValidation =
  | { valid: true; data: CareerAnalysis }
  | { valid: false; errors: string[] };

/* ------------------------------------------------------------------ *
 * Low-level guards — never trust the raw shape of AI output.
 * ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ *
 * Field validators. Each pushes human-readable errors to `errors`.
 * ------------------------------------------------------------------ */

function checkProfessionalSummary(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("professionalSummary is missing or not an object.");
    return;
  }
  if (!isNonEmptyString(value.summary)) errors.push("professionalSummary.summary is invalid.");
  if (!isNonEmptyString(value.profileLevel)) errors.push("professionalSummary.profileLevel is invalid.");
  if (!isNonEmptyString(value.mainCareerDirection))
    errors.push("professionalSummary.mainCareerDirection is invalid.");
}

function checkTechnicalSkills(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("technicalSkills is missing or not an object.");
    return;
  }
  for (const key of ["programmingLanguages", "frameworks", "databases", "tools", "other"]) {
    if (!isStringArray(value[key])) errors.push(`technicalSkills.${key} must be a string array.`);
  }
}

function isSoftSkill(value: unknown): value is SoftSkill {
  return isRecord(value) && isNonEmptyString(value.name) && isString(value.evidence);
}

function isSuggestedProject(value: unknown): value is SuggestedProject {
  return (
    isRecord(value) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.goal) &&
    isStringArray(value.skillsPracticed) &&
    isOneOf(value.difficulty, SKILL_LEVELS)
  );
}

function isRecommendedRole(value: unknown): value is RecommendedRole {
  return (
    isRecord(value) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.title) &&
    isOneOf(value.matchLevel, MATCH_LEVELS) &&
    isNonEmptyString(value.explanation) &&
    isStringArray(value.matchingSkills) &&
    isStringArray(value.missingSkills) &&
    isNonEmptyString(value.roleDescription) &&
    Array.isArray(value.suggestedProjects) &&
    value.suggestedProjects.every(isSuggestedProject) &&
    isStringArray(value.roadmap)
  );
}

function isMissingSkill(value: unknown): value is MissingSkill {
  return (
    isRecord(value) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.reason) &&
    isOneOf(value.priority, PRIORITIES) &&
    isNonEmptyString(value.suggestedAction)
  );
}

function isLearningRecommendation(value: unknown): value is LearningRecommendation {
  return (
    isRecord(value) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.reason) &&
    isNonEmptyString(value.suggestedAction) &&
    isOneOf(value.level, SKILL_LEVELS)
  );
}

/* ------------------------------------------------------------------ *
 * Public validator.
 * ------------------------------------------------------------------ */

/**
 * Validate an unknown value against the `CareerAnalysis` contract.
 * Returns a discriminated result; on success `data` is safely typed.
 */
export function validateCareerAnalysis(input: unknown): AnalysisValidation {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Analysis is missing or not an object."] };
  }

  checkProfessionalSummary(input.professionalSummary, errors);
  checkTechnicalSkills(input.technicalSkills, errors);

  if (!Array.isArray(input.softSkills) || !input.softSkills.every(isSoftSkill)) {
    errors.push("softSkills must be an array of { name, evidence }.");
  }

  // Exactly three recommended roles — a hard requirement.
  if (!Array.isArray(input.recommendedRoles)) {
    errors.push("recommendedRoles must be an array.");
  } else {
    if (input.recommendedRoles.length !== REQUIRED_ROLE_COUNT) {
      errors.push(
        `recommendedRoles must contain exactly ${REQUIRED_ROLE_COUNT} roles (got ${input.recommendedRoles.length}).`,
      );
    }
    if (!input.recommendedRoles.every(isRecommendedRole)) {
      errors.push("One or more recommendedRoles are malformed.");
    }
  }

  if (!Array.isArray(input.missingSkills) || !input.missingSkills.every(isMissingSkill)) {
    errors.push("missingSkills is malformed.");
  }

  if (
    !Array.isArray(input.learningRecommendations) ||
    !input.learningRecommendations.every(isLearningRecommendation)
  ) {
    errors.push("learningRecommendations is malformed.");
  }

  if (!isNonEmptyString(input.responsibleAiNotice)) {
    errors.push("responsibleAiNotice is missing.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Every field validated above; the cast is now sound.
  return { valid: true, data: input as unknown as CareerAnalysis };
}

/**
 * Parse a raw string (or already-parsed object) into a validated analysis.
 * Strips accidental markdown code fences before parsing JSON. Safe to use
 * when reading from sessionStorage or an API response.
 */
export function safeParseAnalysis(raw: unknown): AnalysisValidation {
  if (typeof raw === "string") {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    try {
      return validateCareerAnalysis(JSON.parse(cleaned));
    } catch {
      return { valid: false, errors: ["Response was not valid JSON."] };
    }
  }
  return validateCareerAnalysis(raw);
}
