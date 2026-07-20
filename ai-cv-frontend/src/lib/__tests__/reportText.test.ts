import { describe, expect, it } from "vitest";
import { RESPONSIBLE_AI_MESSAGE, PRIVACY_MESSAGE } from "@/components/ui";
import { analysisToPlainText } from "@/lib/reportText";
import { EXAMPLE_ANALYSIS } from "@/lib/mockAnalysis";

describe("analysisToPlainText", () => {
  const text = analysisToPlainText(EXAMPLE_ANALYSIS, "2026-01-01T00:00:00.000Z");

  it("includes every section heading", () => {
    for (const heading of [
      "YOUR CAREER ANALYSIS",
      "PROFESSIONAL SUMMARY",
      "TECHNICAL SKILLS",
      "SOFT SKILLS",
      "RECOMMENDED ENTRY-LEVEL ROLES",
      "SKILLS TO STRENGTHEN",
      "LEARNING RECOMMENDATIONS",
    ]) {
      expect(text).toContain(heading);
    }
  });

  it("lists all three roles, numbered", () => {
    for (const role of EXAMPLE_ANALYSIS.recommendedRoles) {
      expect(text).toContain(role.title);
    }
    expect(text).toMatch(/1\. .*\n/);
    expect(text).toContain("3. ");
  });

  it("includes the responsible-AI and privacy notices", () => {
    expect(text).toContain(RESPONSIBLE_AI_MESSAGE);
    expect(text).toContain(PRIVACY_MESSAGE);
  });
});
