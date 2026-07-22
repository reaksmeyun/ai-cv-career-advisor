import { jsonrepair } from "jsonrepair";

// Hugging Face Inference Providers OpenAI-compatible router.
const HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_ID = process.env.MODEL_ID || "Qwen/Qwen2.5-1.5B-Instruct";
const MAX_TOKENS = 1200;
const MAX_ATTEMPTS = 3;
const MAX_CHARS = 20_000;

const MATCH_LEVELS = ["High", "Medium", "Developing"];
const PRIORITIES = ["High", "Medium", "Low"];
const LEARNING_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const PROFILE_LEVELS = [
  "Student",
  "Internship Level",
  "Apprentice Level",
  "Entry Level",
  "Junior Level",
];

/** A user-safe AI failure. 502 = provider/token; 503 = invalid model output. */
export class AiServiceError extends Error {
  code: 502 | 503;
  constructor(message: string, code: 502 | 503 = 502) {
    super(message);
    this.code = code;
  }
}

interface FlatRole {
  title: string;
  matchLevel: string;
  reason: string;
  matchingSkills: string[];
  missingSkills: string[];
}

/** Flat analysis shape the frontend adapter (adaptBackendAnalysis) expects. */
export interface FlatAnalysis {
  professionalSummary: string;
  profileLevel: string;
  technicalSkills: string[];
  softSkills: string[];
  recommendedRoles: FlatRole[];
  missingSkills: { skill: string; priority: string; reason: string; action: string }[];
  learningRecommendations: { title: string; level: string; reason: string; action: string }[];
}

const FALLBACK_ROLES: FlatRole[] = [
  { title: "Junior Software Developer", matchLevel: "Developing", reason: "A broad entry-level software role suited to a developing skill set.", matchingSkills: [], missingSkills: [] },
  { title: "Software Development Intern", matchLevel: "Developing", reason: "An internship to build practical, hands-on experience across the stack.", matchingSkills: [], missingSkills: [] },
  { title: "QA / Software Testing Associate", matchLevel: "Developing", reason: "An accessible entry point that values attention to detail and testing.", matchingSkills: [], missingSkills: [] },
];

/* ------------------------------- helpers ------------------------------- */

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const cleaned = item.trim();
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function canonicalize(
  value: unknown,
  aliases: Record<string, string>,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const canonical = aliases[normalizeKey(key)] ?? key;
    if (!(canonical in out)) out[canonical] = item;
  }
  return out;
}

const TOP_ALIASES: Record<string, string> = {
  professionalsummary: "professionalSummary", summary: "professionalSummary",
  profilelevel: "profileLevel", profilerole: "profileLevel", profile: "profileLevel", level: "profileLevel",
  technicalskills: "technicalSkills", techskills: "technicalSkills", hardskills: "technicalSkills", skills: "technicalSkills",
  softskills: "softSkills",
  recommendedroles: "recommendedRoles", recommendation: "recommendedRoles", recommendations: "recommendedRoles", roles: "recommendedRoles",
  missingskills: "missingSkills", skillgaps: "missingSkills", gaps: "missingSkills",
  learningrecommendations: "learningRecommendations", learning: "learningRecommendations", learnings: "learningRecommendations",
};
const ROLE_ALIASES: Record<string, string> = {
  title: "title", role: "title", roletitle: "title", name: "title",
  matchlevel: "matchLevel", match: "matchLevel",
  reason: "reason", explanation: "reason", why: "reason",
  matchingskills: "matchingSkills", matching: "matchingSkills",
  missingskills: "missingSkills", missing: "missingSkills", gaps: "missingSkills",
};
const MISSING_ALIASES: Record<string, string> = {
  skill: "skill", name: "skill", priority: "priority",
  reason: "reason", why: "reason", action: "action", suggestedaction: "action", suggestion: "action",
};
const LEARNING_ALIASES: Record<string, string> = {
  title: "title", name: "title", level: "level",
  reason: "reason", why: "reason", action: "action", suggestedaction: "action", suggestion: "action",
};

function oneOf(value: unknown, allowed: string[], fallback: string): string {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function buildPrompt(cvText: string): string {
  return `
You are a strict CV analysis assistant for students, interns, apprentices, and junior job applicants.

Analyze only information explicitly supported by the CV.

Return valid JSON with exactly this structure:

{
  "professionalSummary": "string",
  "profileLevel": "Student, Internship Level, Apprentice Level, Entry Level, or Junior Level",
  "technicalSkills": ["string"],
  "softSkills": ["string"],
  "recommendedRoles": [
    { "title": "string", "matchLevel": "High, Medium, or Developing", "reason": "string", "matchingSkills": ["string"], "missingSkills": ["string"] }
  ],
  "missingSkills": [
    { "skill": "string", "priority": "High, Medium, or Low", "reason": "string", "action": "string" }
  ],
  "learningRecommendations": [
    { "title": "string", "level": "Beginner, Intermediate, or Advanced", "reason": "string", "action": "string" }
  ]
}

Strict rules:
1. Never invent education, skills, projects, experience, or achievements.
2. Technical skills must be explicitly mentioned in the CV, as SHORT individual terms (e.g. "Python", "React") — never sentences or category labels.
3. Soft skills must be SHORT labels (e.g. "Teamwork") supported by CV activities.
4. recommendedRoles MUST contain exactly three different, distinct roles.
5. Recommend only student, internship, apprentice, entry-level, or junior roles.
6. Use High, Medium, or Developing for matchLevel.
7. Keep the professional summary below 60 words.
8. Keep every reason and action to one short sentence.
9. Provide at most 5 missing skills and at most 4 learning recommendations.
10. Use third-person wording such as "The candidate".
11. Return JSON only. Do not use Markdown or code fences.

CV TEXT:
${cvText}
`.trim();
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  if (start === -1) throw new AiServiceError("The model did not return a JSON object.", 503);
  const end = cleaned.lastIndexOf("}");
  let jsonText = end > start ? cleaned.slice(start, end + 1) : cleaned.slice(start);
  jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(jsonText);
  } catch {
    try {
      const repaired = JSON.parse(jsonrepair(jsonText));
      if (typeof repaired !== "object" || repaired === null || Array.isArray(repaired)) {
        throw new Error("not an object");
      }
      return repaired as Record<string, unknown>;
    } catch {
      throw new AiServiceError("The model output could not be parsed into JSON.", 503);
    }
  }
}

function validateAndClean(raw: Record<string, unknown>): FlatAnalysis {
  const result = canonicalize(raw, TOP_ALIASES);

  const summary = asString(result.professionalSummary);
  if (!summary) throw new AiServiceError("The analysis was incomplete.", 503);

  const technicalSkills = asStringList(result.technicalSkills);
  const techKeys = new Set(technicalSkills.map((s) => s.toLowerCase()));
  const softSkills = asStringList(result.softSkills).filter((s) => !techKeys.has(s.toLowerCase()));
  const existing = new Set([...technicalSkills, ...softSkills].map((s) => s.toLowerCase()));

  const rawRoles = Array.isArray(result.recommendedRoles) ? result.recommendedRoles : [];
  const roles: FlatRole[] = [];
  const titles = new Set<string>();
  for (const r of rawRoles) {
    const role = canonicalize(r, ROLE_ALIASES);
    const title = asString(role.title);
    if (!title || titles.has(title.toLowerCase())) continue;
    titles.add(title.toLowerCase());
    roles.push({
      title,
      matchLevel: oneOf(role.matchLevel, MATCH_LEVELS, "Developing"),
      reason: asString(role.reason),
      matchingSkills: asStringList(role.matchingSkills).filter((s) => existing.has(s.toLowerCase())),
      missingSkills: asStringList(role.missingSkills).filter((s) => !existing.has(s.toLowerCase())),
    });
  }
  if (roles.length === 0) throw new AiServiceError("The model did not produce any usable roles.", 503);
  for (const fb of FALLBACK_ROLES) {
    if (roles.length >= 3) break;
    if (!titles.has(fb.title.toLowerCase())) {
      titles.add(fb.title.toLowerCase());
      roles.push({ ...fb });
    }
  }
  const recommendedRoles = roles.slice(0, 3);

  const seenMissing = new Set<string>();
  const missingSkills = (Array.isArray(result.missingSkills) ? result.missingSkills : [])
    .map((item) => canonicalize(item, MISSING_ALIASES))
    .map((item) => ({
      skill: asString(item.skill),
      priority: oneOf(item.priority, PRIORITIES, "Medium"),
      reason: asString(item.reason),
      action: asString(item.action),
    }))
    .filter((m) => {
      const key = m.skill.toLowerCase();
      if (!m.skill || existing.has(key) || seenMissing.has(key)) return false;
      seenMissing.add(key);
      return true;
    });

  const seenLearn = new Set<string>();
  const learningRecommendations = (Array.isArray(result.learningRecommendations) ? result.learningRecommendations : [])
    .map((item) => canonicalize(item, LEARNING_ALIASES))
    .map((item) => ({
      title: asString(item.title),
      level: oneOf(item.level, LEARNING_LEVELS, "Beginner"),
      reason: asString(item.reason),
      action: asString(item.action),
    }))
    .filter((l) => {
      const key = l.title.toLowerCase();
      if (!l.title || seenLearn.has(key)) return false;
      seenLearn.add(key);
      return true;
    });

  return {
    professionalSummary: summary,
    profileLevel: oneOf(result.profileLevel, PROFILE_LEVELS, "Entry Level"),
    technicalSkills,
    softSkills,
    recommendedRoles,
    missingSkills,
    learningRecommendations,
  };
}

/* ---------------------------- inference ---------------------------- */

async function generateOnce(cvText: string, sample: boolean): Promise<string> {
  const token = process.env.HF_TOKEN;
  if (!token) {
    throw new AiServiceError("The analysis service is not configured. Please try again later.", 502);
  }

  let res: Response;
  try {
    res = await fetch(HF_ROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: "You analyze CVs objectively. Return valid JSON only and never invent facts." },
          { role: "user", content: buildPrompt(cvText) },
        ],
        max_tokens: MAX_TOKENS,
        temperature: sample ? 0.5 : 0.2,
      }),
    });
  } catch (error) {
    console.error("HF router network error:", error);
    throw new AiServiceError("Could not reach the AI provider. Please try again.", 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("HF router error", res.status, body.slice(0, 500));
    const hint = body.replace(/hf_[A-Za-z0-9]+/g, "hf_***").slice(0, 200);
    throw new AiServiceError(`AI provider error ${res.status}: ${hint}`, 502);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new AiServiceError("The AI provider returned an unreadable response.", 502);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new AiServiceError("The model returned an empty response. Please try again.", 502);
  }
  return content;
}

/** Run the CV analysis via Hugging Face Inference Providers. */
export async function analyzeCv(cvText: string): Promise<FlatAnalysis> {
  const input = cvText.trim().slice(0, MAX_CHARS);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await generateOnce(input, attempt > 0);
      return validateAndClean(extractJson(raw));
    } catch (error) {
      // Provider/token errors won't be fixed by retrying.
      if (error instanceof AiServiceError && error.code === 502) throw error;
      if (attempt === MAX_ATTEMPTS - 1) {
        throw new AiServiceError("The AI returned an incomplete result. Please run the analysis again.", 503);
      }
    }
  }
  throw new AiServiceError("The AI returned an incomplete result. Please run the analysis again.", 503);
}
