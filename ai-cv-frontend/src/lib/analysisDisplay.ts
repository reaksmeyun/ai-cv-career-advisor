import type { BadgeVariant } from "@/components/ui/Badge";
import type { SkillTagTone } from "@/components/ui/SkillTag";
import type { MatchLevel, Priority, SkillLevel } from "@/types/analysis";

/** Badge variant for a role match level (no numeric percentages — by design). */
export function matchLevelBadge(level: MatchLevel): BadgeVariant {
  switch (level) {
    case "High":
      return "success";
    case "Medium":
      return "primary";
    case "Developing":
      return "ai";
  }
}

/** Badge variant for a skill-gap priority. */
export function priorityBadge(priority: Priority): BadgeVariant {
  switch (priority) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    case "Low":
      return "neutral";
  }
}

/** Badge variant for a learning level. */
export function levelBadge(level: SkillLevel): BadgeVariant {
  switch (level) {
    case "Beginner":
      return "success";
    case "Intermediate":
      return "primary";
    case "Advanced":
      return "ai";
  }
}

/** Skill-tag tone helpers used across results and role details. */
export const MATCHING_SKILL_TONE: SkillTagTone = "success";
export const MISSING_SKILL_TONE: SkillTagTone = "warning";
