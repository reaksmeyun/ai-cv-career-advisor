import { FolderGit2, GraduationCap, Route, type LucideIcon } from "lucide-react";
import { Badge, Card } from "@/components/ui";

interface Resource {
  icon: LucideIcon;
  title: string;
  description: string;
}

const resources: Resource[] = [
  {
    icon: Route,
    title: "Choosing Your First Tech Role",
    description:
      "Understand the difference between frontend, backend, and full-stack paths for junior developers.",
  },
  {
    icon: FolderGit2,
    title: "Building a Strong Project Portfolio",
    description:
      "Practical project ideas that demonstrate real skills to internship and apprenticeship reviewers.",
  },
  {
    icon: GraduationCap,
    title: "Preparing for Junior Interviews",
    description:
      "Common fundamentals to review and how to talk about your projects with confidence.",
  },
];

export function CareerResourcesPreview() {
  return (
    <section id="resources" className="scroll-mt-20 bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">Career Resources</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Learn as You Grow
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Short, practical guidance topics for students, interns, and junior
            professionals.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map(({ icon: Icon, title, description }) => (
            <Card key={title} interactive className="flex flex-col p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-card-sm bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {description}
              </p>
              <p className="mt-4 text-xs font-medium text-muted">Coming soon</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
