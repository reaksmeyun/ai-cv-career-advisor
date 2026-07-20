import {
  ArrowRight,
  Award,
  Brain,
  ClipboardList,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: ClipboardList,
    title: "Enter Your CV",
    description: "Paste CV text or upload a supported document.",
  },
  {
    icon: Brain,
    title: "AI Reviews the Content",
    description: "The system extracts education, experience, projects, and skills.",
  },
  {
    icon: Target,
    title: "Career Fit Is Evaluated",
    description: "The AI compares the profile with realistic entry-level career paths.",
  },
  {
    icon: Award,
    title: "Receive Your Career Report",
    description: "View recommended roles, strengths, gaps, and learning suggestions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Four simple steps from CV to career clarity.
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li key={title} className="relative flex flex-col items-center text-center">
              {/* Connecting line to the next step (desktop only) */}
              {index < steps.length - 1 && (
                <span
                  className="absolute left-1/2 top-7 hidden h-px w-full bg-border lg:block"
                  aria-hidden="true"
                />
              )}

              <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-card-sm bg-ai-gradient text-white shadow-md">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ai">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                {description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex justify-center">
          <Button
            href="/analyze"
            variant="gradient"
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" aria-hidden="true" />}
          >
            Start Analyzing My CV
          </Button>
        </div>
      </div>
    </section>
  );
}
