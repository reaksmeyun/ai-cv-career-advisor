import {
  Award,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";

interface OutputItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const outputs: OutputItem[] = [
  {
    icon: FileText,
    title: "Professional summary",
    description: "A short overview of your profile level and main career direction.",
  },
  {
    icon: Wrench,
    title: "Technical skills",
    description: "Programming languages, frameworks, databases, and tools detected in your CV.",
  },
  {
    icon: Sparkles,
    title: "Soft skills",
    description: "Skills inferred from the experiences and activities you describe.",
  },
  {
    icon: Target,
    title: "Three recommended entry-level roles",
    description: "Realistic junior, internship, or apprentice roles with a match level.",
  },
  {
    icon: TrendingUp,
    title: "Missing skills",
    description: "Important skill gaps for your target roles, with suggested actions.",
  },
  {
    icon: GraduationCap,
    title: "Learning recommendations",
    description: "Practical next steps for projects, tools, and topics to learn.",
  },
];

export function ExpectedOutput() {
  return (
    <div>
      {/* Empty-state illustration built from UI elements */}
      <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-background/60 px-6 py-8 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-card-sm bg-ai-gradient text-white shadow-md">
          <Award className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">
          Your analysis will appear here
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          Add your CV on the left and run the analysis to generate a structured
          career report.
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ink">What you&apos;ll receive</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {outputs.map(({ icon: Icon, title, description }) => (
            <Card key={title} size="sm" className="flex gap-3 p-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-card-sm bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
