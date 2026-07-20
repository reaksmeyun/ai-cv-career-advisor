import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Hide the "Powered by Generative AI" subtitle (e.g. tight spaces). */
  showSubtitle?: boolean;
}

/** Brand mark: a CV document with an AI sparkle + wordmark. */
export function Logo({ className, showSubtitle = true }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — home`}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-card-sm bg-ai-gradient text-white shadow-sm">
        <FileText className="h-5 w-5" aria-hidden="true" />
        <Sparkles
          className="absolute -right-1 -top-1 h-3.5 w-3.5 text-accent drop-shadow"
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-bold tracking-tight text-ink sm:text-[17px]">
          AI CV Career Advisor
        </span>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-muted">
            Powered by Generative AI
          </span>
        )}
      </span>
    </Link>
  );
}
