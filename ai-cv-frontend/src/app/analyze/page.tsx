import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@/components/ui";
import { AnalyzePanel } from "@/components/analyze/AnalyzePanel";

export const metadata: Metadata = {
  title: "Analyze CV",
  description:
    "Paste or upload your CV to receive AI-generated skill analysis, entry-level role recommendations, and learning suggestions.",
};

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" label="Loading analyzer" />
        </div>
      }
    >
      <AnalyzePanel />
    </Suspense>
  );
}
