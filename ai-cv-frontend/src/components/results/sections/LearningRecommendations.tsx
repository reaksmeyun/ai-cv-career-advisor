import { GraduationCap } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { levelBadge } from "@/lib/analysisDisplay";
import type { LearningRecommendation } from "@/types/analysis";

export function LearningRecommendations({
  data,
}: {
  data: LearningRecommendation[];
}) {
  return (
    <section id="learning-recommendations" className="scroll-mt-20">
      <div className="flex items-center gap-2.5">
        <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink sm:text-xl">
          Learning recommendations
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        A suggested order for your next learning steps.
      </p>

      <ol className="mt-5 space-y-4">
        {data.map((item, index) => (
          <Card key={item.title} size="sm" className="flex gap-4 p-5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai-gradient text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <Badge variant={levelBadge(item.level)}>{item.level}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">
                <span className="font-medium text-ink">Why: </span>
                {item.reason}
              </p>
              <p className="mt-1.5 text-sm text-muted">
                <span className="font-medium text-ink">Suggested action: </span>
                {item.suggestedAction}
              </p>
            </div>
          </Card>
        ))}
      </ol>
    </section>
  );
}
