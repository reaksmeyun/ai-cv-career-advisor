import { FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { ResultSection } from "@/components/results/ResultSection";
import type { ProfessionalSummary as SummaryType } from "@/types/analysis";

export function ProfessionalSummary({ data }: { data: SummaryType }) {
  return (
    <ResultSection
      id="professional-summary"
      icon={<FileText className="h-5 w-5" aria-hidden="true" />}
      title="Professional summary"
      action={
        <Badge variant="ai" icon={<Sparkles className="h-3 w-3" />}>
          AI Generated
        </Badge>
      }
    >
      <p className="text-muted">{data.summary}</p>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card-sm border border-border bg-background p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Profile level
          </dt>
          <dd className="mt-1 font-medium text-ink">{data.profileLevel}</dd>
        </div>
        <div className="rounded-card-sm border border-border bg-background p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Main career direction
          </dt>
          <dd className="mt-1 font-medium text-ink">{data.mainCareerDirection}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted">
        This summary is AI-generated guidance based on your CV — not a verified
        professional assessment.
      </p>
    </ResultSection>
  );
}
