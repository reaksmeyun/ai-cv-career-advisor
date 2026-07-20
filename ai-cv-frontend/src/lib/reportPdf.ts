import { jsPDF } from "jspdf";
import { RESPONSIBLE_AI_MESSAGE, PRIVACY_MESSAGE } from "@/components/ui";
import type { CareerAnalysis } from "@/types/analysis";

/* Brand colours as RGB tuples (match the design tokens). */
const NAVY: [number, number, number] = [23, 37, 84];
const PRIMARY: [number, number, number] = [37, 99, 235];
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [100, 116, 139];

/**
 * Build a clean, vector (text-based) PDF from the analysis and trigger a local
 * download. Nothing is uploaded — generation happens entirely in the browser.
 * Throws on failure so the caller can show an error message.
 */
export function downloadAnalysisPdf(
  analysis: CareerAnalysis,
  createdAt: string,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  /** Move to a new page if the next block wouldn't fit. */
  function ensureSpace(needed: number): void {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function setColor(rgb: [number, number, number]): void {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  /** Write wrapped text, paginating as needed. Returns nothing (advances y). */
  function writeText(
    text: string,
    options: {
      size?: number;
      color?: [number, number, number];
      style?: "normal" | "bold";
      gapAfter?: number;
      lineHeight?: number;
    } = {},
  ): void {
    const {
      size = 10,
      color = INK,
      style = "normal",
      gapAfter = 6,
      lineHeight = 1.35,
    } = options;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    setColor(color);

    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    const step = size * lineHeight;
    for (const line of lines) {
      ensureSpace(step);
      doc.text(line, margin, y);
      y += step;
    }
    y += gapAfter;
  }

  function sectionHeading(text: string): void {
    ensureSpace(28);
    y += 6;
    writeText(text, { size: 13, color: PRIMARY, style: "bold", gapAfter: 4 });
    // underline rule
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 6;
  }

  // --- Title block ---
  writeText("Your Career Analysis", {
    size: 22,
    color: NAVY,
    style: "bold",
    gapAfter: 2,
  });
  writeText("Generated from the information provided in your CV", {
    size: 10,
    color: MUTED,
    gapAfter: 2,
  });
  writeText(`Analysis date: ${new Date(createdAt).toLocaleString()}`, {
    size: 9,
    color: MUTED,
    gapAfter: 8,
  });

  // --- Professional summary ---
  const summary = analysis.professionalSummary;
  sectionHeading("Professional Summary");
  writeText(summary.summary);
  writeText(`Profile level: ${summary.profileLevel}`, { color: MUTED, gapAfter: 2 });
  writeText(`Main career direction: ${summary.mainCareerDirection}`, {
    color: MUTED,
  });

  // --- Technical skills ---
  const tech = analysis.technicalSkills;
  const techGroups: [string, string[]][] = [
    ["Programming Languages", tech.programmingLanguages],
    ["Frameworks", tech.frameworks],
    ["Databases", tech.databases],
    ["Tools", tech.tools],
    ["Other", tech.other],
  ];
  sectionHeading("Technical Skills");
  for (const [label, items] of techGroups) {
    if (items.length > 0) {
      writeText(`${label}: ${items.join(", ")}`, { gapAfter: 3 });
    }
  }

  // --- Soft skills ---
  sectionHeading("Soft Skills");
  for (const skill of analysis.softSkills) {
    writeText(`${skill.name} — ${skill.evidence}`, { gapAfter: 3 });
  }

  // --- Recommended roles ---
  sectionHeading("Recommended Entry-Level Roles");
  analysis.recommendedRoles.forEach((role, index) => {
    writeText(`${index + 1}. ${role.title} (${role.matchLevel} match)`, {
      style: "bold",
      gapAfter: 2,
    });
    writeText(role.explanation, { color: MUTED, gapAfter: 2 });
    if (role.matchingSkills.length > 0) {
      writeText(`Matching skills: ${role.matchingSkills.join(", ")}`, {
        size: 9,
        color: MUTED,
        gapAfter: 2,
      });
    }
    if (role.missingSkills.length > 0) {
      writeText(`Skills to strengthen: ${role.missingSkills.join(", ")}`, {
        size: 9,
        color: MUTED,
        gapAfter: 8,
      });
    }
  });

  // --- Skills to strengthen ---
  sectionHeading("Skills to Strengthen");
  for (const skill of analysis.missingSkills) {
    writeText(`${skill.name} (${skill.priority} priority)`, {
      style: "bold",
      gapAfter: 2,
    });
    writeText(`Why it matters: ${skill.reason}`, { color: MUTED, gapAfter: 2 });
    writeText(`Suggested action: ${skill.suggestedAction}`, {
      color: MUTED,
      gapAfter: 6,
    });
  }

  // --- Learning recommendations ---
  sectionHeading("Learning Recommendations");
  analysis.learningRecommendations.forEach((item, index) => {
    writeText(`${index + 1}. ${item.title} (${item.level})`, {
      style: "bold",
      gapAfter: 2,
    });
    writeText(`Why: ${item.reason}`, { color: MUTED, gapAfter: 2 });
    writeText(`Suggested action: ${item.suggestedAction}`, {
      color: MUTED,
      gapAfter: 6,
    });
  });

  // --- Notices ---
  sectionHeading("Important Notices");
  writeText(`Responsible AI: ${RESPONSIBLE_AI_MESSAGE}`, {
    size: 9,
    color: MUTED,
    gapAfter: 4,
  });
  writeText(`Privacy: ${PRIVACY_MESSAGE}`, { size: 9, color: MUTED });

  doc.save("career-analysis.pdf");
}
