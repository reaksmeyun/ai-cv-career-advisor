/**
 * Structured career-analysis contract returned by the AI backend.
 * These types are the single source of truth for the results and
 * role-details screens. The runtime validator in
 * `src/lib/analysisValidation.ts` guarantees any object typed as
 * `CareerAnalysis` actually matches this shape.
 */

/** Allowed values, kept as const arrays so the validator can reuse them. */
export const MATCH_LEVELS = ["High", "Medium", "Developing"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

export type MatchLevel = (typeof MATCH_LEVELS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export interface ProfessionalSummary {
  summary: string;
  profileLevel: string;
  mainCareerDirection: string;
}

export interface TechnicalSkills {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  other: string[];
}

export interface SoftSkill {
  name: string;
  evidence: string;
}

export interface SuggestedProject {
  title: string;
  goal: string;
  skillsPracticed: string[];
  difficulty: SkillLevel;
}

export interface RecommendedRole {
  slug: string;
  title: string;
  matchLevel: MatchLevel;
  explanation: string;
  matchingSkills: string[];
  missingSkills: string[];
  roleDescription: string;
  suggestedProjects: SuggestedProject[];
  roadmap: string[];
}

export interface MissingSkill {
  name: string;
  reason: string;
  priority: Priority;
  suggestedAction: string;
}

export interface LearningRecommendation {
  title: string;
  reason: string;
  suggestedAction: string;
  level: SkillLevel;
}

/** The AI must always return exactly three recommended roles. */
export type RecommendedRoles = [RecommendedRole, RecommendedRole, RecommendedRole];

export interface CareerAnalysis {
  professionalSummary: ProfessionalSummary;
  technicalSkills: TechnicalSkills;
  softSkills: SoftSkill[];
  recommendedRoles: RecommendedRoles;
  missingSkills: MissingSkill[];
  learningRecommendations: LearningRecommendation[];
  responsibleAiNotice: string;
}
