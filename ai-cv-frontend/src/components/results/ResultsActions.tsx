"use client";

import { useState } from "react";
import { Check, Copy, Download, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { analysisToPlainText } from "@/lib/reportText";
import type { CareerAnalysis } from "@/types/analysis";

interface ResultsActionsProps {
  analysis: CareerAnalysis;
  createdAt: string;
  onAnalyzeAnother: () => void;
}

export function ResultsActions({
  analysis,
  createdAt,
  onAnalyzeAnother,
}: ResultsActionsProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setError(null);
    const text = analysisToPlainText(analysis, createdAt);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to the clipboard. Please try again.");
    }
  }

  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    setError(null);
    setPdfLoading(true);
    try {
      // Lazy-load jsPDF only when the user actually exports a PDF.
      const { downloadAnalysisPdf } = await import("@/lib/reportPdf");
      downloadAnalysisPdf(analysis, createdAt);
    } catch {
      setError("Could not generate the PDF. Please try printing instead.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center print:hidden">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onAnalyzeAnother}
        leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
      >
        Analyze Another CV
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleCopy}
        leftIcon={
          copied ? (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )
        }
      >
        {copied ? "Copied!" : "Copy Results"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={pdfLoading}
        leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
      >
        {pdfLoading ? "Preparing…" : "Download PDF"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => window.print()}
        leftIcon={<Printer className="h-4 w-4" aria-hidden="true" />}
      >
        Print Report
      </Button>
      {error && (
        <span className="w-full text-xs text-error sm:w-auto" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
