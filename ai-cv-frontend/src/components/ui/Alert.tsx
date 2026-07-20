import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
  /** Override the default icon; pass null to hide it. */
  icon?: ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { icon: LucideIcon; container: string; iconColor: string }
> = {
  info: {
    icon: Info,
    container: "border-primary/20 bg-primary/5",
    iconColor: "text-primary",
  },
  success: {
    icon: CheckCircle2,
    container: "border-success/20 bg-success/5",
    iconColor: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    container: "border-warning/30 bg-warning/5",
    iconColor: "text-[#b45309]",
  },
  error: {
    icon: XCircle,
    container: "border-error/20 bg-error/5",
    iconColor: "text-error",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  icon,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-card-sm border p-4 text-sm",
        config.container,
        className,
      )}
    >
      {icon !== null && (
        <span className={cn("mt-0.5 shrink-0", config.iconColor)}>
          {icon ?? <Icon className="h-5 w-5" aria-hidden="true" />}
        </span>
      )}
      <div className="min-w-0">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && (
          <div className={cn("text-muted", title && "mt-1")}>{children}</div>
        )}
      </div>
    </div>
  );
}
