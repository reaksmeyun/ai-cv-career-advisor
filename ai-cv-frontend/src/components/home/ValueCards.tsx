import { AlertTriangle, BookOpen, Brain, Target, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ValueCard {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClass: string;
}

const cards: ValueCard[] = [
  {
    icon: Brain,
    title: "Skill Detection",
    description: "Identify technical and soft skills supported by your CV content.",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: Target,
    title: "Career Recommendations",
    description: "Discover realistic internship, apprentice, and junior-level roles.",
    iconClass: "bg-ai/10 text-ai",
  },
  {
    icon: AlertTriangle,
    title: "Skill-Gap Analysis",
    description: "Understand which important skills may be missing for your target role.",
    iconClass: "bg-warning/10 text-[#b45309]",
  },
  {
    icon: BookOpen,
    title: "Learning Guidance",
    description: "Receive practical recommendations for projects, tools, and topics.",
    iconClass: "bg-success/10 text-success",
  },
];

export function ValueCards() {
  return (
    <section id="features" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            What You Get From Your Analysis
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Structured, actionable insights generated from the information you
            provide in your CV.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, description, iconClass }) => (
            <Card key={title} interactive className="p-6">
              <span
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-card-sm",
                  iconClass,
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
