import { describe, expect, it } from "vitest";
import {
  safeParseAnalysis,
  validateCareerAnalysis,
} from "@/lib/analysisValidation";
import type { CareerAnalysis, RecommendedRole } from "@/types/analysis";

function makeRole(overrides: Partial<RecommendedRole> = {}): RecommendedRole {
  return {
    slug: "junior-frontend-developer",
    title: "Junior Frontend Developer",
    matchLevel: "High",
    explanation: "Strong match based on React and TypeScript experience.",
    matchingSkills: ["React", "TypeScript"],
    missingSkills: ["Testing"],
    roleDescription: "Builds user interfaces for web applications.",
    suggestedProjects: [
      {
        title: "Portfolio site",
        goal: "Practice component design.",
        skillsPracticed: ["React"],
        difficulty: "Beginner",
      },
    ],
    roadmap: ["Strengthen fundamentals", "Build two complete projects"],
    ...overrides,
  };
}

function makeValidAnalysis(): CareerAnalysis {
  return {
    professionalSummary: {
      summary: "A final-year software engineering student.",
      profileLevel: "Student",
      mainCareerDirection: "Frontend development",
    },
    technicalSkills: {
      programmingLanguages: ["JavaScript", "TypeScript"],
      frameworks: ["React"],
      databases: ["PostgreSQL"],
      tools: ["Git"],
      other: [],
    },
    softSkills: [{ name: "Teamwork", evidence: "Worked in a team of four." }],
    recommendedRoles: [makeRole(), makeRole(), makeRole()],
    missingSkills: [
      {
        name: "Automated testing",
        reason: "Expected in most junior roles.",
        priority: "High",
        suggestedAction: "Learn Vitest or Jest.",
      },
    ],
    learningRecommendations: [
      {
        title: "Learn testing fundamentals",
        reason: "Improves code reliability.",
        suggestedAction: "Complete a testing tutorial.",
        level: "Beginner",
      },
    ],
    responsibleAiNotice: "This analysis is AI-generated guidance.",
  };
}

describe("validateCareerAnalysis", () => {
  it("accepts a fully valid analysis", () => {
    const result = validateCareerAnalysis(makeValidAnalysis());
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.recommendedRoles).toHaveLength(3);
    }
  });

  it("rejects a non-object", () => {
    expect(validateCareerAnalysis(null).valid).toBe(false);
    expect(validateCareerAnalysis("nope").valid).toBe(false);
    expect(validateCareerAnalysis([]).valid).toBe(false);
  });

  it("rejects a missing professional summary", () => {
    const analysis = makeValidAnalysis() as unknown as Record<string, unknown>;
    delete analysis.professionalSummary;
    const result = validateCareerAnalysis(analysis);
    expect(result.valid).toBe(false);
  });

  it("rejects an invalid matchLevel enum", () => {
    const analysis = makeValidAnalysis();
    analysis.recommendedRoles[0] = makeRole({
      matchLevel: "Excellent" as RecommendedRole["matchLevel"],
    });
    expect(validateCareerAnalysis(analysis).valid).toBe(false);
  });

  it("rejects when there are not exactly three roles", () => {
    const two = makeValidAnalysis() as unknown as Record<string, unknown>;
    two.recommendedRoles = [makeRole(), makeRole()];
    const twoResult = validateCareerAnalysis(two);
    expect(twoResult.valid).toBe(false);
    if (!twoResult.valid) {
      expect(twoResult.errors.some((e) => e.includes("exactly 3"))).toBe(true);
    }

    const four = makeValidAnalysis() as unknown as Record<string, unknown>;
    four.recommendedRoles = [makeRole(), makeRole(), makeRole(), makeRole()];
    expect(validateCareerAnalysis(four).valid).toBe(false);
  });

  it("rejects a technicalSkills group that is not a string array", () => {
    const analysis = makeValidAnalysis() as unknown as Record<string, unknown>;
    (analysis.technicalSkills as Record<string, unknown>).tools = "Git";
    expect(validateCareerAnalysis(analysis).valid).toBe(false);
  });
});

describe("safeParseAnalysis", () => {
  it("parses a plain JSON string", () => {
    const json = JSON.stringify(makeValidAnalysis());
    expect(safeParseAnalysis(json).valid).toBe(true);
  });

  it("strips markdown code fences before parsing", () => {
    const json = "```json\n" + JSON.stringify(makeValidAnalysis()) + "\n```";
    expect(safeParseAnalysis(json).valid).toBe(true);
  });

  it("rejects invalid JSON", () => {
    const result = safeParseAnalysis("{ not json ]");
    expect(result.valid).toBe(false);
  });

  it("validates an already-parsed object", () => {
    expect(safeParseAnalysis(makeValidAnalysis()).valid).toBe(true);
  });
});
