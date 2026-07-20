import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "sm" uses the 16px small-card radius; default uses the 20px main radius. */
  size?: "sm" | "md";
  /** Adds a subtle hover lift for interactive cards. */
  interactive?: boolean;
}

export function Card({
  size = "md",
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "border border-border bg-card shadow-sm",
        size === "sm" ? "rounded-card-sm" : "rounded-card",
        interactive &&
          "transition-shadow transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
