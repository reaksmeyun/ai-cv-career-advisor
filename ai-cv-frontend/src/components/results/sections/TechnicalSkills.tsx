import { Wrench } from "lucide-react";
import { SkillTag } from "@/components/ui";
import { ResultSection } from "@/components/results/ResultSection";
import type { TechnicalSkills as TechnicalSkillsType } from "@/types/analysis";

const GROUPS: { key: keyof TechnicalSkillsType; label: string }[] = [
  { key: "programmingLanguages", label: "Programming Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "databases", label: "Databases" },
  { key: "tools", label: "Tools" },
  { key: "other", label: "Other Technical Skills" },
];

export function TechnicalSkills({ data }: { data: TechnicalSkillsType }) {
  const nonEmpty = GROUPS.filter((group) => data[group.key].length > 0);

  return (
    <ResultSection
      icon={<Wrench className="h-5 w-5" aria-hidden="true" />}
      title="Technical skills"
    >
      {nonEmpty.length === 0 ? (
        <p className="text-sm text-muted">
          No specific technical skills were detected in the CV.
        </p>
      ) : (
        <div className="space-y-5">
          {nonEmpty.map((group) => (
            <div key={group.key}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {group.label}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data[group.key].map((skill) => (
                  <SkillTag key={skill} tone="primary">
                    {skill}
                  </SkillTag>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ResultSection>
  );
}
