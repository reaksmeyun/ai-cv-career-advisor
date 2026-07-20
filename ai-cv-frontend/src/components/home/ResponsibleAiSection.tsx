import { Eye, Lock, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import { RESPONSIBLE_AI_MESSAGE } from "@/components/ui";

interface Principle {
  icon: LucideIcon;
  title: string;
  description: string;
}

const principles: Principle[] = [
  {
    icon: Eye,
    title: "Evidence-based",
    description:
      "Recommendations are explained using information found in your CV, not invented qualifications.",
  },
  {
    icon: Scale,
    title: "Guidance, not judgement",
    description:
      "The output is career guidance — never a hiring decision, personality, or professional certification.",
  },
  {
    icon: Lock,
    title: "Privacy-first",
    description:
      "Your CV and analysis are not permanently stored by this application.",
  },
];

export function ResponsibleAiSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-card border border-ai/15 bg-ai/5 p-8 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-medium text-ai shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Responsible AI
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Built to be Honest and Transparent
            </h2>
            <p className="mt-4 text-base text-muted">{RESPONSIBLE_AI_MESSAGE}</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {principles.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-card-sm border border-border bg-card p-5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-card-sm bg-ai/10 text-ai">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
