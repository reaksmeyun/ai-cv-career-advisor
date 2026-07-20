import { Sparkles } from "lucide-react";
import { ResultSection } from "@/components/results/ResultSection";
import type { SoftSkill } from "@/types/analysis";

export function SoftSkills({ data }: { data: SoftSkill[] }) {
  return (
    <ResultSection
      icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
      title="Soft skills"
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted">No soft skills were inferred from the CV.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((skill) => (
            <li
              key={skill.name}
              className="rounded-card-sm border border-border bg-background p-4"
            >
              <p className="font-medium text-ink">{skill.name}</p>
              {skill.evidence && (
                <p className="mt-1 text-sm text-muted">{skill.evidence}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted">
        These skills are inferred from the experiences and activities described in
        the CV.
      </p>
    </ResultSection>
  );
}
