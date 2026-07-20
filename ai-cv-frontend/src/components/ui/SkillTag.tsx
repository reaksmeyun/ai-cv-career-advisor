import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkillTagTone = "neutral" | "primary" | "success" | "warning";

interface SkillTagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: SkillTagTone;
}

const toneClasses: Record<SkillTagTone, string> = {
  neutral: "border-border bg-background text-ink",
  primary: "border-primary/20 bg-primary/5 text-primary",
  success: "border-success/20 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-[#b45309]",
};

export function SkillTag({
  tone = "neutral",
  className,
  children,
  ...rest
}: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-medium",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
