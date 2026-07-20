import { RESPONSIBLE_AI_MESSAGE, PRIVACY_MESSAGE } from "@/components/ui";
import type { CareerAnalysis } from "@/types/analysis";

/**
 * Serialize an analysis into a clean plain-text report for "Copy Results".
 * Excludes navigation and interactive elements (report content only).
 */
export function analysisToPlainText(
  analysis: CareerAnalysis,
  createdAt?: string,
): string {
  const lines: string[] = [];
  const rule = "=".repeat(48);

  lines.push("YOUR CAREER ANALYSIS");
  lines.push("Generated from the information provided in your CV");
  if (createdAt) {
    lines.push(`Date: ${new Date(createdAt).toLocaleString()}`);
  }
  lines.push(rule, "");

  const summary = analysis.professionalSummary;
  lines.push("PROFESSIONAL SUMMARY");
  lines.push(summary.summary);
  lines.push(`Profile level: ${summary.profileLevel}`);
  lines.push(`Main career direction: ${summary.mainCareerDirection}`);
  lines.push("");

  const tech = analysis.technicalSkills;
  lines.push("TECHNICAL SKILLS");
  const techGroups: [string, string[]][] = [
    ["Programming Languages", tech.programmingLanguages],
    ["Frameworks", tech.frameworks],
    ["Databases", tech.databases],
    ["Tools", tech.tools],
    ["Other", tech.other],
  ];
  for (const [label, items] of techGroups) {
    if (items.length > 0) lines.push(`- ${label}: ${items.join(", ")}`);
  }
  lines.push("");

  lines.push("SOFT SKILLS");
  for (const skill of analysis.softSkills) {
    lines.push(`- ${skill.name}: ${skill.evidence}`);
  }
  lines.push("");

  lines.push("RECOMMENDED ENTRY-LEVEL ROLES");
  analysis.recommendedRoles.forEach((role, index) => {
    lines.push(`${index + 1}. ${role.title} (${role.matchLevel} match)`);
    lines.push(`   ${role.explanation}`);
    if (role.matchingSkills.length > 0) {
      lines.push(`   Matching skills: ${role.matchingSkills.join(", ")}`);
    }
    if (role.missingSkills.length > 0) {
      lines.push(`   Skills to strengthen: ${role.missingSkills.join(", ")}`);
    }
  });
  lines.push("");

  lines.push("SKILLS TO STRENGTHEN");
  for (const skill of analysis.missingSkills) {
    lines.push(`- ${skill.name} (${skill.priority} priority)`);
    lines.push(`   Why it matters: ${skill.reason}`);
    lines.push(`   Suggested action: ${skill.suggestedAction}`);
  }
  lines.push("");

  lines.push("LEARNING RECOMMENDATIONS");
  analysis.learningRecommendations.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title} (${item.level})`);
    lines.push(`   Why: ${item.reason}`);
    lines.push(`   Suggested action: ${item.suggestedAction}`);
  });
  lines.push("");

  lines.push(rule);
  lines.push(`Responsible AI notice: ${RESPONSIBLE_AI_MESSAGE}`);
  lines.push(`Privacy: ${PRIVACY_MESSAGE}`);

  return lines.join("\n");
}
