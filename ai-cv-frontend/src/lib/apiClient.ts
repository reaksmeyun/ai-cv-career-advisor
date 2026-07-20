import { apiUrl } from "@/config/api";
import { adaptBackendAnalysis } from "@/lib/adaptBackendAnalysis";
import { validateCareerAnalysis } from "@/lib/analysisValidation";
import { messages } from "@/lib/messages";
import type { CareerAnalysis } from "@/types/analysis";

export type AnalyzeOutcome =
  | { ok: true; analysis: CareerAnalysis }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Map an HTTP response into a validated analysis or a user-facing error. */
async function handleResponse(
  res: Response,
  kind: "text" | "file",
): Promise<AnalyzeOutcome> {
  if (!res.ok) {
    if (res.status === 422) {
      // Validation / extraction / malformed-model errors.
      return {
        ok: false,
        error: kind === "file" ? messages.unreadableDocument : messages.invalidModelResponse,
      };
    }
    // 500 and everything else → the service could not complete the analysis.
    return { ok: false, error: messages.aiUnavailable };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: messages.invalidModelResponse };
  }

  // /analyze-file wraps the analysis; /analyze-text returns it directly.
  const backendData = kind === "file" && isRecord(json) ? json.analysis : json;

  const adapted = adaptBackendAnalysis(backendData);
  const validation = validateCareerAnalysis(adapted);
  if (!validation.valid) {
    return { ok: false, error: messages.invalidModelResponse };
  }
  return { ok: true, analysis: validation.data };
}

/** Send pasted CV text to the backend for analysis. */
export async function analyzeText(
  cvText: string,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    const res = await fetch(apiUrl("/analyze-text"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText }),
      signal,
    });
    return await handleResponse(res, "text");
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { ok: false, error: messages.networkError };
  }
}

/** Upload a CV file (PDF/DOCX/image) to the backend for extraction + analysis. */
export async function analyzeFile(
  file: File,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(apiUrl("/analyze-file"), {
      method: "POST",
      body: form,
      signal,
    });
    return await handleResponse(res, "file");
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { ok: false, error: messages.networkError };
  }
}
