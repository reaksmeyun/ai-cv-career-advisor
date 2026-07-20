import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "ai"
  | "success"
  | "warning"
  | "error";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-background text-muted border border-border",
  primary: "bg-primary/10 text-primary",
  ai: "bg-ai/10 text-ai",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-[#b45309]",
  error: "bg-error/10 text-error",
};

export function Badge({
  variant = "neutral",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
