import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Canonical privacy message reused across the app (results, footer, etc.). */
export const PRIVACY_MESSAGE =
  "Your CV and analysis are not permanently stored by this application. Download your report before closing the session.";

interface PrivacyWarningProps {
  /** Override the message for context-specific warnings (e.g. the analyzer page). */
  message?: string;
  className?: string;
}

export function PrivacyWarning({
  message = PRIVACY_MESSAGE,
  className,
}: PrivacyWarningProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-card-sm border border-primary/20 bg-primary/5 p-4 text-sm text-muted",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
