import { GraduationCap, Info } from "lucide-react";
import { Button } from "@/components/ui";

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            About This Project
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            An AI Career Guidance Tool for Students
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            AI CV Career Advisor is a university final project that helps
            students, fresh graduates, interns, and junior professionals turn
            their CV into structured, easy-to-understand career guidance.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-card-sm border border-border bg-card p-4 text-left text-sm text-muted">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              <span className="font-semibold text-ink">Current scope: </span>
              this tool generates AI-based guidance only. It does not connect to
              real internship or job listings and does not apply to positions on
              your behalf. Use it to understand your skills and plan your next
              learning steps.
            </p>
          </div>

          <div className="mt-8">
            <Button href="/analyze" variant="gradient" size="lg">
              Analyze My CV
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
