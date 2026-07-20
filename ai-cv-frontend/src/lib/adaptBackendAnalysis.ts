import { RESPONSIBLE_AI_MESSAGE } from "@/components/ui";
import type {
  CareerAnalysis,
  LearningRecommendation,
  MatchLevel,
  MissingSkill,
  Priority,
  RecommendedRole,
  SkillLevel,
  SoftSkill,
  SuggestedProject,
  TechnicalSkills,
} from "@/types/analysis";

/* ------------------------------------------------------------------ *
 * Backend response shape (flat schema from the FastAPI service).
 * ------------------------------------------------------------------ */

interface BackendRole {
  title: string;
  matchLevel: string;
  reason: string;
  matchingSkills: string[];
  missingSkills: string[];
}

interface BackendMissingSkill {
  skill: string;
  priority: string;
  reason: string;
  action: string;
}

interface BackendLearning {
  title: string;
  level: string;
  reason: string;
  action: string;
}

export interface BackendAnalysis {
  professionalSummary: string;
  profileLevel: string;
  technicalSkills: string[];
  softSkills: string[];
  recommendedRoles: BackendRole[];
  missingSkills: BackendMissingSkill[];
  learningRecommendations: BackendLearning[];
}

/* ------------------------------------------------------------------ *
 * Helpers.
 * ------------------------------------------------------------------ */

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Turn a role title into a URL-safe slug. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "role"
  );
}

/** Keyword dictionaries for grouping flat technical skills. */
const CATEGORY_KEYWORDS: Record<keyof Omit<TechnicalSkills, "other">, string[]> = {
  programmingLanguages: [
    "javascript", "typescript", "python", "java", "c", "c++", "c#", "go",
    "golang", "ruby", "php", "swift", "kotlin", "rust", "sql", "html", "css",
    "dart", "scala", "r", "bash", "shell", "perl", "objective-c",
  ],
  frameworks: [
    "react", "next.js", "nextjs", "next", "vue", "angular", "svelte", "node.js",
    "nodejs", "node", "express", "django", "flask", "fastapi", "spring",
    "laravel", "rails", "tailwind", "tailwind css", "bootstrap", ".net", "redux",
    "nestjs", "remix", "astro",
  ],
  databases: [
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "supabase",
    "firebase", "oracle", "mariadb", "dynamodb", "prisma", "drizzle",
    "drizzle orm", "sql server", "cassandra", "neo4j",
  ],
  tools: [
    "git", "github", "gitlab", "docker", "kubernetes", "figma", "vscode", "jira",
    "postman", "rest api", "rest apis", "ci/cd", "aws", "azure", "gcp", "linux",
    "npm", "webpack", "vite", "jest", "vitest", "cypress", "playwright",
    "graphql", "nginx", "terraform",
  ],
};

/** Categorize flat technical skills into grouped buckets. */
export function categorizeTechnicalSkills(skills: string[]): TechnicalSkills {
  const grouped: TechnicalSkills = {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    other: [],
  };

  for (const skill of skills) {
    const key = skill.trim().toLowerCase();
    if (!key) continue;
    const category = (
      ["programmingLanguages", "frameworks", "databases", "tools"] as const
    ).find((cat) => CATEGORY_KEYWORDS[cat].includes(key));
    grouped[category ?? "other"].push(skill.trim());
  }

  return grouped;
}

/** Deterministic 5-step roadmap tailored to a role. */
function buildRoadmap(roleTitle: string): string[] {
  return [
    `Strengthen the fundamentals behind the ${roleTitle} role`,
    "Build two complete, portfolio-ready projects",
    "Learn testing and debugging practices",
    "Improve your GitHub profile and project READMEs",
    "Apply for internships, apprenticeships, or junior roles",
  ];
}

/** Deterministic suggested projects derived from a role's missing skills. */
function buildProjects(role: BackendRole): SuggestedProject[] {
  const difficulties: SkillLevel[] = ["Beginner", "Intermediate", "Intermediate"];
  const focusSkills = role.missingSkills.slice(0, 3);

  if (focusSkills.length === 0) {
    return [
      {
        title: `${role.title} portfolio project`,
        goal: `Build a complete project that demonstrates readiness for a ${role.title} role.`,
        skillsPracticed: role.matchingSkills.slice(0, 3),
        difficulty: "Intermediate",
      },
    ];
  }

  return focusSkills.map((skill, index) => ({
    title: `Practice project: ${skill}`,
    goal: `Build a small, focused project that applies ${skill} in a realistic scenario.`,
    skillsPracticed: [skill, ...role.matchingSkills.slice(0, 2)],
    difficulty: difficulties[index] ?? "Intermediate",
  }));
}

/* ------------------------------------------------------------------ *
 * Adapter.
 * ------------------------------------------------------------------ */

/**
 * Map the backend's flat analysis into the rich `CareerAnalysis` shape the UI
 * expects. Fields the backend doesn't produce (grouped skills, per-role
 * projects & roadmaps, soft-skill evidence, responsible-AI notice) are filled
 * deterministically by the app. The result should be passed through
 * `validateCareerAnalysis` before use.
 */
export function adaptBackendAnalysis(raw: unknown): CareerAnalysis {
  const data = (raw ?? {}) as Partial<BackendAnalysis>;

  const roles: BackendRole[] = Array.isArray(data.recommendedRoles)
    ? data.recommendedRoles
    : [];

  const usedSlugs = new Set<string>();
  const recommendedRoles: RecommendedRole[] = roles.map((role) => {
    const title = asString(role.title).trim();
    const reason = asString(role.reason).trim();
    const matchingSkills = asStringArray(role.matchingSkills);
    const missing = asStringArray(role.missingSkills);

    let slug = slugify(title);
    while (usedSlugs.has(slug)) slug = `${slug}-role`;
    usedSlugs.add(slug);

    // Fallbacks keep a valid backend response from being rejected by the
    // strict validator when the model leaves an optional string empty.
    return {
      slug,
      title,
      matchLevel: asString(role.matchLevel) as MatchLevel,
      explanation:
        reason ||
        `${title} aligns with the skills and experience described in your CV.`,
      matchingSkills,
      missingSkills: missing,
      roleDescription:
        reason ||
        `${title} is a realistic entry-level role based on your current profile.`,
      suggestedProjects: buildProjects({
        title,
        matchLevel: asString(role.matchLevel),
        reason,
        matchingSkills,
        missingSkills: missing,
      }),
      roadmap: buildRoadmap(title),
    };
  });

  const softSkills: SoftSkill[] = asStringArray(data.softSkills)
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .map((name) => ({ name, evidence: "" }));

  const missingSkills: MissingSkill[] = (
    Array.isArray(data.missingSkills) ? data.missingSkills : []
  )
    .map((item) => ({
      name: asString(item.skill).trim(),
      reason:
        asString(item.reason).trim() ||
        "This skill is commonly expected for the recommended roles.",
      priority: asString(item.priority) as Priority,
      suggestedAction:
        asString(item.action).trim() ||
        "Practice this skill through a small project or short course.",
    }))
    .filter((skill) => skill.name.length > 0);

  const learningRecommendations: LearningRecommendation[] = (
    Array.isArray(data.learningRecommendations) ? data.learningRecommendations : []
  )
    .map((item) => ({
      title: asString(item.title).trim(),
      reason:
        asString(item.reason).trim() ||
        "This step strengthens your readiness for the recommended roles.",
      suggestedAction:
        asString(item.action).trim() ||
        "Find a focused tutorial or project to practice this.",
      level: asString(item.level) as SkillLevel,
    }))
    .filter((item) => item.title.length > 0);

  const mainCareerDirection =
    recommendedRoles[0]?.title || asString(data.profileLevel) || "Entry-level roles";

  return {
    professionalSummary: {
      summary: asString(data.professionalSummary),
      profileLevel: asString(data.profileLevel),
      mainCareerDirection,
    },
    technicalSkills: categorizeTechnicalSkills(asStringArray(data.technicalSkills)),
    softSkills,
    // The validator enforces exactly three; cast is checked downstream.
    recommendedRoles: recommendedRoles as CareerAnalysis["recommendedRoles"],
    missingSkills,
    learningRecommendations,
    responsibleAiNotice: RESPONSIBLE_AI_MESSAGE,
  };
}
