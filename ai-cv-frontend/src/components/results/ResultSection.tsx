import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ResultSectionProps {
  icon?: ReactNode;
  title: string;
  /** Optional right-aligned element (e.g. an "AI Generated" badge). */
  action?: ReactNode;
  /** Optional muted line under the title. */
  description?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Consistent titled card used for every results-dashboard section. */
export function ResultSection({
  icon,
  title,
  action,
  description,
  id,
  className,
  children,
}: ResultSectionProps) {
  return (
    <Card id={id} className={cn("scroll-mt-20 p-6 sm:p-7", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-lg font-semibold text-ink sm:text-xl">{title}</h2>
        </div>
        {action}
      </div>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}
