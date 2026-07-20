import { BookOpen, Brain, FileText, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui";
import { SkillTag } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Abstract, decorative CV-analysis illustration built purely from UI elements
 * (no real person). All content here is illustrative example data — it is
 * labelled as such and never presented as a real result.
 */
export function CvAnalysisMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      {/* Soft gradient glow behind the card */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-ai-gradient opacity-10 blur-2xl" />

      {/* Floating badge: top */}
      <div className="absolute -left-3 -top-4 z-10 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-md sm:inline-flex">
        <Brain className="h-3.5 w-3.5 text-ai" />
        AI-Powered
      </div>

      {/* Main card */}
      <div className="rounded-card border border-border bg-card p-5 shadow-xl sm:p-6">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-card-sm bg-ai-gradient text-white">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">CV Analysis</p>
            <p className="truncate text-xs text-muted">
              Processing your career profile…
            </p>
          </div>
          <Badge variant="ai" icon={<Sparkles className="h-3 w-3" />}>
            AI
          </Badge>
        </div>

        {/* Detected skills */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Detected Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["JavaScript", "React", "TypeScript", "Node.js", "Git", "PostgreSQL"].map(
              (skill) => (
                <SkillTag key={skill} tone="primary" className="text-xs">
                  {skill}
                </SkillTag>
              ),
            )}
          </div>
        </div>

        {/* Recommended roles */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Recommended Roles
          </p>
          <div className="mt-2 space-y-2">
            <MockRole title="Junior Frontend Developer" match="High" />
            <MockRole title="Software Developer Apprentice" match="Medium" />
          </div>
        </div>

        {/* Skill gaps */}
        <div className="mt-4 rounded-card-sm border border-warning/30 bg-warning/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#b45309]">
            <Target className="h-3.5 w-3.5" />
            Skill Gaps Identified
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Testing", "CI/CD", "REST APIs"].map((gap) => (
              <SkillTag key={gap} tone="warning" className="text-xs">
                {gap}
              </SkillTag>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge: bottom */}
      <div className="absolute -bottom-4 right-4 z-10 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-md sm:inline-flex">
        <BookOpen className="h-3.5 w-3.5 text-success" />
        Learning Roadmap
      </div>

      {/* Honest "example" label (project rule: label illustrative content) */}
      <p className="mt-3 text-center text-[11px] text-muted">
        Illustrative example — not a real analysis
      </p>
    </div>
  );
}

function MockRole({ title, match }: { title: string; match: "High" | "Medium" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card-sm border border-border bg-background px-3 py-2.5">
      <span className="text-sm font-medium text-ink">{title}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          match === "High"
            ? "bg-success/10 text-success"
            : "bg-primary/10 text-primary",
        )}
      >
        {match} Match
      </span>
    </div>
  );
}
