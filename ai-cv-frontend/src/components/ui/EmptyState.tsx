import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateTone = "default" | "warning" | "error";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  tone?: EmptyStateTone;
  /** Action buttons/links. */
  children?: ReactNode;
  className?: string;
}

const toneClasses: Record<EmptyStateTone, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-[#b45309]",
  error: "bg-error/10 text-error",
};

/**
 * Full-width empty / error / missing state: icon, clear title, short
 * explanation, and a recommended action (passed as children).
 */
export function EmptyState({
  icon,
  title,
  description,
  tone = "default",
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center rounded-card border border-border bg-card px-6 py-10 text-center shadow-sm",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "inline-flex h-14 w-14 items-center justify-center rounded-card-sm",
            toneClasses[tone],
          )}
        >
          {icon}
        </span>
      )}
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      )}
      {children && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
