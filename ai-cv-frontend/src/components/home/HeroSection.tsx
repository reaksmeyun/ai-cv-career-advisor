import { CheckCircle2, Eye, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { CvAnalysisMockup } from "./CvAnalysisMockup";

const featurePoints = [
  "Detect technical and soft skills",
  "Recommend suitable junior career roles",
  "Identify important skill gaps",
  "Suggest practical next learning steps",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft background wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="mx-auto grid max-w-page items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-20">
        {/* Left: copy */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ai/10 px-3 py-1.5 text-sm font-medium text-ai">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI-Powered Career Guidance
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Turn Your CV Into a{" "}
            <span className="text-ai-gradient">Clear Career Direction</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Paste or upload your CV and receive AI-generated skill analysis,
            suitable entry-level job recommendations, missing-skill insights, and
            practical learning suggestions.
          </p>

          <ul className="mt-7 space-y-3">
            {featurePoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-ink">
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span className="text-sm sm:text-base">{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              href="/analyze"
              variant="gradient"
              size="lg"
              leftIcon={<Zap className="h-5 w-5" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Analyze My CV
            </Button>
            <Button
              href="/analyze?example=1"
              variant="secondary"
              size="lg"
              leftIcon={<Eye className="h-5 w-5" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              View Example Analysis
            </Button>
          </div>

          <p className="mt-6 flex items-start gap-2 text-sm text-muted">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            Your CV is used only to generate the analysis. Remove sensitive
            personal information before submitting.
          </p>
        </div>

        {/* Right: abstract illustration */}
        <div className="lg:pl-6">
          <CvAnalysisMockup />
        </div>
      </div>
    </section>
  );
}
