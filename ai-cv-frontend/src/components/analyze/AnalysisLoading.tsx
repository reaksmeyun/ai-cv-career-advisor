"use client";

import { useEffect, useState } from "react";
import { Check, FileText, X } from "lucide-react";
import { Button, SkillTag } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Named steps shown during analysis (interface feedback only). */
const STEPS = [
  "Reading CV content",
  "Identifying education and experience",
  "Detecting skills",
  "Evaluating suitable career roles",
  "Preparing learning recommendations",
] as const;

const DECORATIVE_TAGS = [
  "Skills",
  "Experience",
  "Education",
  "Projects",
  "Roles",
  "Learning",
];

/** Progress creeps toward this cap while we wait, then jumps to 100 when done. */
const PROGRESS_CAP = 94;
const REASSURE_AFTER_S = 20;

interface AnalysisLoadingProps {
  onCancel: () => void;
  /** Set true when the real analysis has finished — fills the bar to 100%. */
  done?: boolean;
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AnalysisLoading({ onCancel, done = false }: AnalysisLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Simulated progress creeps toward the cap while we wait. When `done`, we
  // render 100% directly (below) rather than setting state in the effect.
  useEffect(() => {
    if (done) return;
    const timer = setInterval(
      () =>
        setProgress((value) =>
          value >= PROGRESS_CAP
            ? value
            : Math.min(
                PROGRESS_CAP,
                value + Math.max(0.5, (PROGRESS_CAP - value) * 0.035),
              ),
        ),
      400,
    );
    return () => clearInterval(timer);
  }, [done]);

  // Elapsed-time counter so the screen never looks frozen.
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [done]);

  const pct = done ? 100 : Math.round(progress);
  // Steps turn green in sync with the fill.
  const doneSteps = done
    ? STEPS.length
    : Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length));
  const visibleTags = Math.min(
    DECORATIVE_TAGS.length,
    Math.max(1, Math.ceil((pct / 100) * DECORATIVE_TAGS.length)),
  );

  return (
    <section
      className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:py-16"
      aria-live="polite"
      aria-busy={!done}
    >
      {/* Animated CV document scan */}
      <div className="relative h-44 w-36 overflow-hidden rounded-card border border-border bg-card shadow-md">
        <div className="flex h-full flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="h-2 w-14 rounded bg-border" />
          </div>
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded bg-border",
                i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-4/5" : "w-3/5",
              )}
            />
          ))}
        </div>
        <span
          className="animate-cv-scan absolute left-0 h-8 w-full bg-gradient-to-b from-primary/0 via-primary/25 to-primary/0"
          aria-hidden="true"
        />
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {done ? "Analysis complete!" : "Analyzing your CV…"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        {done
          ? "Opening your results…"
          : "The AI model runs on the server and can take a few minutes. Please keep this page open."}
      </p>

      {/* Percentage + gradual fill bar */}
      <div className="mt-6 w-full max-w-md">
        <div className="mb-2 flex items-baseline justify-between">
          <span
            className="text-3xl font-bold tabular-nums text-ai-gradient"
            aria-label={`${pct} percent`}
          >
            {pct}%
          </span>
          <span className="text-xs tabular-nums text-muted" aria-label="Elapsed time">
            {formatElapsed(elapsed)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border border-border bg-background">
          <div
            className="h-full rounded-full bg-ai-gradient transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Decorative skill tags appearing */}
      <div className="mt-6 flex min-h-8 flex-wrap items-center justify-center gap-2">
        {DECORATIVE_TAGS.slice(0, visibleTags).map((tag) => (
          <SkillTag key={tag} tone="primary" className="text-xs">
            {tag}
          </SkillTag>
        ))}
      </div>

      {/* Step checklist */}
      <ol className="mt-8 w-full max-w-md space-y-2 text-left">
        {STEPS.map((step, index) => {
          const stepDone = index < doneSteps;
          const current = !done && index === doneSteps;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-card-sm border px-4 py-2.5 text-sm transition-colors",
                current
                  ? "border-primary/30 bg-primary/5 text-ink"
                  : stepDone
                    ? "border-border bg-card text-muted"
                    : "border-border bg-card text-muted/70",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  stepDone
                    ? "bg-success text-white"
                    : current
                      ? "bg-primary text-white"
                      : "bg-border text-transparent",
                )}
                aria-hidden="true"
              >
                {stepDone ? (
                  <Check className="h-3 w-3" />
                ) : current ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                ) : null}
              </span>
              <span className={cn(current && "font-medium")}>{step}</span>
            </li>
          );
        })}
      </ol>

      {!done && elapsed >= REASSURE_AFTER_S && (
        <p className="mt-6 max-w-md rounded-card-sm border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted">
          Still working — your CV is being analyzed by the AI model. This is
          normal and can take a few minutes. Please don&apos;t close the page.
        </p>
      )}

      {!done && (
        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          >
            Cancel Analysis
          </Button>
        </div>
      )}

      <p className="mt-6 max-w-md text-xs text-muted">
        Progress shown here is interface feedback only. It does not represent the
        AI&apos;s confidence or the accuracy of the result.
      </p>
    </section>
  );
}
