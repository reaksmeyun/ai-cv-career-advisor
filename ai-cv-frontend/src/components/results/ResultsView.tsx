"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { FileSearch } from "lucide-react";
import {
  Alert,
  Button,
  EmptyState,
  PrivacyWarning,
  ResponsibleAiNotice,
  Spinner,
} from "@/components/ui";
import {
  SSR_SENTINEL,
  clearAll,
  getResultServerSnapshot,
  getResultSnapshot,
  parseResultRaw,
  subscribeResult,
  type LoadedResult,
} from "@/lib/analysisStorage";
import { messages } from "@/lib/messages";
import { ResultsActions } from "./ResultsActions";
import { ProfessionalSummary } from "./sections/ProfessionalSummary";
import { TechnicalSkills } from "./sections/TechnicalSkills";
import { SoftSkills } from "./sections/SoftSkills";
import { RecommendedRoles } from "./sections/RecommendedRoles";
import { MissingSkills } from "./sections/MissingSkills";
import { LearningRecommendations } from "./sections/LearningRecommendations";

export function ResultsView() {
  const router = useRouter();

  const snapshot = useSyncExternalStore(
    subscribeResult,
    getResultSnapshot,
    getResultServerSnapshot,
  );

  const state: LoadedResult | "loading" = useMemo(
    () => (snapshot === SSR_SENTINEL ? "loading" : parseResultRaw(snapshot)),
    [snapshot],
  );

  function analyzeAnother() {
    // Clear temporary CV + result data before starting over (privacy).
    clearAll();
    router.push("/analyze");
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading your analysis" />
      </div>
    );
  }

  if (state.status !== "ok") {
    const invalid = state.status === "invalid";
    return (
      <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState
          tone="warning"
          icon={<FileSearch className="h-7 w-7" aria-hidden="true" />}
          title={invalid ? "Analysis unavailable" : "No analysis found"}
          description={invalid ? messages.invalidModelResponse : messages.missingResult}
        >
          <Button href="/analyze" variant="gradient">
            Analyze a CV
          </Button>
        </EmptyState>
      </section>
    );
  }

  const { analysis, createdAt, demo } = state.result;
  const generated = new Date(createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your Career Analysis
          </h1>
          <p className="mt-2 text-muted">
            Generated from the information provided in your CV
          </p>
          <p className="mt-1 text-sm text-muted">Analysis date: {generated}</p>
        </div>
        <ResultsActions
          analysis={analysis}
          createdAt={createdAt}
          onAnalyzeAnother={analyzeAnother}
        />
      </header>

      {demo && (
        <Alert variant="info" className="mt-6 print:hidden" title="Example / demo result">
          This is labelled example data shown to demonstrate the workflow. The AI
          backend is not connected yet, so this is not a real analysis of your CV.
        </Alert>
      )}

      {/* Sections */}
      <div className="mt-6 space-y-6">
        <ProfessionalSummary data={analysis.professionalSummary} />
        <TechnicalSkills data={analysis.technicalSkills} />
        <SoftSkills data={analysis.softSkills} />
        <RecommendedRoles roles={analysis.recommendedRoles} />
        <MissingSkills data={analysis.missingSkills} />
        <LearningRecommendations data={analysis.learningRecommendations} />

        <ResponsibleAiNotice />
        <PrivacyWarning />
      </div>
    </section>
  );
}
