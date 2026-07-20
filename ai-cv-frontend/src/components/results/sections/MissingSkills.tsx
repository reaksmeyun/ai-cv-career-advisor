import { TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { priorityBadge } from "@/lib/analysisDisplay";
import type { MissingSkill } from "@/types/analysis";

export function MissingSkills({ data }: { data: MissingSkill[] }) {
  return (
    <section id="missing-skills" className="scroll-mt-20">
      <div className="flex items-center gap-2.5">
        <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink sm:text-xl">
          Skills to strengthen
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Growing these skills can widen your opportunities — none of this reflects on
        your current ability.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {data.map((skill) => (
          <Card key={skill.name} size="sm" className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-ink">{skill.name}</h3>
              <Badge variant={priorityBadge(skill.priority)}>
                {skill.priority} priority
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Why it matters: </span>
              {skill.reason}
            </p>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">Suggested action: </span>
              {skill.suggestedAction}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
