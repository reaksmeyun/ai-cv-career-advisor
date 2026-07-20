import { describe, expect, it } from "vitest";
import { parseResultRaw } from "@/lib/analysisStorage";
import { EXAMPLE_ANALYSIS } from "@/lib/mockAnalysis";

function storedJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    analysis: EXAMPLE_ANALYSIS,
    createdAt: "2026-01-01T00:00:00.000Z",
    source: "example",
    demo: true,
    ...overrides,
  });
}

describe("parseResultRaw", () => {
  it("returns empty for null or empty input", () => {
    expect(parseResultRaw(null).status).toBe("empty");
    expect(parseResultRaw("").status).toBe("empty");
  });

  it("returns invalid for malformed JSON", () => {
    expect(parseResultRaw("{ not json").status).toBe("invalid");
  });

  it("returns invalid for a non-object payload", () => {
    expect(parseResultRaw("42").status).toBe("invalid");
  });

  it("returns invalid when the analysis fails validation", () => {
    const broken = storedJson({ analysis: { professionalSummary: {} } });
    expect(parseResultRaw(broken).status).toBe("invalid");
  });

  it("returns ok with validated data for a good payload", () => {
    const result = parseResultRaw(storedJson());
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.result.source).toBe("example");
      expect(result.result.demo).toBe(true);
      expect(result.result.analysis.recommendedRoles).toHaveLength(3);
    }
  });

  it("defaults an unknown source to mock", () => {
    const result = parseResultRaw(storedJson({ source: "weird" }));
    if (result.status === "ok") {
      expect(result.result.source).toBe("mock");
    }
  });
});
