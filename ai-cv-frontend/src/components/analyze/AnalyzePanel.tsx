"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, RotateCw, Sparkles, UploadCloud } from "lucide-react";
import { Alert, Button, PrivacyWarning } from "@/components/ui";
import { EXAMPLE_CV_TEXT } from "@/lib/exampleCv";
import { EXAMPLE_ANALYSIS } from "@/lib/mockAnalysis";
import { saveResult } from "@/lib/analysisStorage";
import { analyzeFile, analyzeText } from "@/lib/apiClient";
import { validateCvText } from "@/lib/validation";
import { messages } from "@/lib/messages";
import { USE_MOCK } from "@/config/api";
import { cn } from "@/lib/utils";
import type { CareerAnalysis } from "@/types/analysis";
import { PasteTab } from "./PasteTab";
import { UploadTab } from "./UploadTab";
import { ExpectedOutput } from "./ExpectedOutput";
import { AnalysisLoading } from "./AnalysisLoading";

type Tab = "paste" | "upload";
type Phase = "input" | "loading";

/** Internal result of a run: a validated analysis + whether it's demo data. */
type RunResult =
  | { ok: true; analysis: CareerAnalysis; demo: boolean }
  | { ok: false; error: string };

const ANALYZE_PRIVACY =
  "Remove sensitive information such as national ID numbers, bank details, passwords, and exact home addresses before submitting.";

export function AnalyzePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Pre-fill the example when arriving from "View Example Analysis" (lazy init,
  // so we don't call setState inside an effect).
  const fromExample = searchParams.get("example") === "1";
  const [phase, setPhase] = useState<Phase>("input");
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState(fromExample ? EXAMPLE_CV_TEXT : "");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const textValidation = validateCvText(text);
  const canAnalyze =
    tab === "paste" ? textValidation.valid : file !== null && fileError === null;

  /** Perform the analysis: mock data, or a real backend call. */
  async function performAnalysis(signal: AbortSignal): Promise<RunResult> {
    if (USE_MOCK) {
      // Demo mode: no backend call. Show the labelled example analysis.
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return { ok: true, analysis: EXAMPLE_ANALYSIS, demo: true };
    }
    const outcome =
      tab === "paste"
        ? await analyzeText(text, signal)
        : await analyzeFile(file as File, signal);
    return outcome.ok
      ? { ok: true, analysis: outcome.analysis, demo: false }
      : outcome;
  }

  function handleAnalyze() {
    if (!canAnalyze) return;
    setSubmitError(null);
    setAnalysisDone(false);
    setPhase("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    performAnalysis(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.ok) {
          saveResult({
            analysis: result.analysis,
            createdAt: new Date().toISOString(),
            source: result.demo ? "mock" : "ai",
            demo: result.demo,
          });
          // Let the progress bar fill to 100% before navigating.
          setAnalysisDone(true);
          setTimeout(() => router.push("/results"), 800);
        } else {
          setPhase("input");
          setSubmitError(result.error);
        }
      })
      .catch((error) => {
        // Ignore cancellations; surface everything else as a network error.
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        setPhase("input");
        setSubmitError(messages.networkError);
      });
  }

  function handleCancel() {
    abortRef.current?.abort();
    setAnalysisDone(false);
    setPhase("input");
  }

  if (phase === "loading") {
    return <AnalysisLoading onCancel={handleCancel} done={analysisDone} />;
  }

  return (
    <section className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Analyze Your CV
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Paste your CV text or upload a document. You&apos;ll receive structured,
          AI-generated career guidance — not a hiring decision.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: input */}
        <div>
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="CV input method"
            className="grid grid-cols-2 gap-1 rounded-input border border-border bg-background p-1"
          >
            <TabButton
              active={tab === "paste"}
              onClick={() => setTab("paste")}
              id="tab-paste"
              controls="panel-paste"
              icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            >
              Paste CV Text
            </TabButton>
            <TabButton
              active={tab === "upload"}
              onClick={() => setTab("upload")}
              id="tab-upload"
              controls="panel-upload"
              icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
            >
              Upload CV
            </TabButton>
          </div>

          <div className="mt-5">
            {tab === "paste" ? (
              <div role="tabpanel" id="panel-paste" aria-labelledby="tab-paste">
                <PasteTab
                  value={text}
                  onChange={setText}
                  onUseExample={() => setText(EXAMPLE_CV_TEXT)}
                  onClear={() => setText("")}
                />
              </div>
            ) : (
              <div role="tabpanel" id="panel-upload" aria-labelledby="tab-upload">
                <UploadTab
                  file={file}
                  error={fileError}
                  onFileAccepted={(f) => {
                    setFile(f);
                    setFileError(null);
                  }}
                  onFileRejected={(err) => {
                    setFile(null);
                    setFileError(err);
                  }}
                  onRemove={() => {
                    setFile(null);
                    setFileError(null);
                  }}
                />
              </div>
            )}
          </div>

          <PrivacyWarning message={ANALYZE_PRIVACY} className="mt-6" />

          {submitError && (
            <Alert variant="error" className="mt-4" title="Analysis failed">
              <p>{submitError}</p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAnalyze}
                  leftIcon={<RotateCw className="h-4 w-4" aria-hidden="true" />}
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          <div className="mt-6">
            <Button
              type="button"
              variant="gradient"
              size="lg"
              fullWidth
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              leftIcon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            >
              Analyze My CV
            </Button>
            {!canAnalyze && tab === "paste" && (
              <p
                className={cn(
                  "mt-2 text-center text-xs",
                  text.trim().length === 0 ? "text-muted" : "text-[#b45309]",
                )}
              >
                {textValidation.error}
              </p>
            )}
          </div>
        </div>

        {/* Right: expected output / empty state */}
        <div className="lg:pl-2">
          <ExpectedOutput />
        </div>
      </div>
    </section>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  id: string;
  controls: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function TabButton({ active, onClick, id, controls, icon, children }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors",
        active
          ? "bg-card text-primary shadow-sm"
          : "text-muted hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
