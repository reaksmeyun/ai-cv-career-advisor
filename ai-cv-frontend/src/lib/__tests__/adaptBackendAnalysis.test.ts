import { describe, expect, it } from "vitest";
import {
  adaptBackendAnalysis,
  categorizeTechnicalSkills,
  slugify,
  type BackendAnalysis,
} from "@/lib/adaptBackendAnalysis";
import { validateCareerAnalysis } from "@/lib/analysisValidation";

function makeBackendRole(title: string) {
  return {
    title,
    matchLevel: "High",
    reason: `Strong alignment with the ${title} role based on the CV.`,
    matchingSkills: ["React", "TypeScript"],
    missingSkills: ["Testing", "Accessibility"],
  };
}

function makeBackendAnalysis(): BackendAnalysis {
  return {
    professionalSummary: "The candidate is a final-year software engineering student.",
    profileLevel: "Student",
    technicalSkills: ["JavaScript", "React", "PostgreSQL", "Git", "Kanban"],
    softSkills: ["Teamwork", "Communication"],
    recommendedRoles: [
      makeBackendRole("Junior Frontend Developer"),
      makeBackendRole("Full-Stack Apprentice"),
      makeBackendRole("Software Developer Intern"),
    ],
    missingSkills: [
      { skill: "Automated testing", priority: "High", reason: "Expected in junior roles.", action: "Learn Vitest." },
    ],
    learningRecommendations: [
      { title: "Learn testing", level: "Beginner", reason: "Improves reliability.", action: "Do a tutorial." },
    ],
  };
}

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("Junior Frontend Developer")).toBe("junior-frontend-developer");
    expect(slugify("Full-Stack / Web!")).toBe("full-stack-web");
    expect(slugify("   ")).toBe("role");
  });
});

describe("categorizeTechnicalSkills", () => {
  it("groups skills into the right buckets", () => {
    const grouped = categorizeTechnicalSkills([
      "JavaScript",
      "React",
      "PostgreSQL",
      "Git",
      "Kanban",
    ]);
    expect(grouped.programmingLanguages).toContain("JavaScript");
    expect(grouped.frameworks).toContain("React");
    expect(grouped.databases).toContain("PostgreSQL");
    expect(grouped.tools).toContain("Git");
    expect(grouped.other).toContain("Kanban");
  });
});

describe("adaptBackendAnalysis", () => {
  const adapted = adaptBackendAnalysis(makeBackendAnalysis());

  it("produces a fully valid CareerAnalysis", () => {
    expect(validateCareerAnalysis(adapted).valid).toBe(true);
  });

  it("keeps exactly three roles with slugs, projects, and roadmaps", () => {
    expect(adapted.recommendedRoles).toHaveLength(3);
    for (const role of adapted.recommendedRoles) {
      expect(role.slug).toBeTruthy();
      expect(role.suggestedProjects.length).toBeGreaterThan(0);
      expect(role.roadmap.length).toBeGreaterThan(0);
    }
  });

  it("renames flat backend fields to the rich schema", () => {
    expect(adapted.missingSkills[0].name).toBe("Automated testing");
    expect(adapted.missingSkills[0].suggestedAction).toBe("Learn Vitest.");
    expect(adapted.learningRecommendations[0].suggestedAction).toBe("Do a tutorial.");
    expect(adapted.softSkills[0]).toEqual({ name: "Teamwork", evidence: "" });
  });

  it("adds a responsible-AI notice", () => {
    expect(adapted.responsibleAiNotice.length).toBeGreaterThan(0);
  });

  it("stays valid when the model leaves optional strings empty", () => {
    const backend = makeBackendAnalysis();
    // Simulate a successful backend response with empty reasons/actions.
    backend.recommendedRoles = backend.recommendedRoles.map((role) => ({
      ...role,
      reason: "",
    }));
    backend.missingSkills = [
      { skill: "Testing", priority: "High", reason: "", action: "" },
    ];
    backend.learningRecommendations = [
      { title: "Learn testing", level: "Beginner", reason: "", action: "" },
    ];

    const result = adaptBackendAnalysis(backend);
    expect(validateCareerAnalysis(result).valid).toBe(true);
    expect(result.recommendedRoles[0].explanation.length).toBeGreaterThan(0);
    expect(result.recommendedRoles[0].roleDescription.length).toBeGreaterThan(0);
    expect(result.missingSkills[0].suggestedAction.length).toBeGreaterThan(0);
    expect(result.learningRecommendations[0].suggestedAction.length).toBeGreaterThan(0);
  });

  it("drops list items that have no name/title", () => {
    const backend = makeBackendAnalysis();
    backend.missingSkills = [
      { skill: "", priority: "High", reason: "x", action: "y" },
      { skill: "Docker", priority: "Low", reason: "x", action: "y" },
    ];
    const result = adaptBackendAnalysis(backend);
    expect(result.missingSkills).toHaveLength(1);
    expect(result.missingSkills[0].name).toBe("Docker");
  });
});
