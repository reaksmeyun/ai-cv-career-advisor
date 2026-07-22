import { adaptBackendAnalysis } from "@/lib/adaptBackendAnalysis";
import { validateCareerAnalysis } from "@/lib/analysisValidation";
import { messages } from "@/lib/messages";
import type { CareerAnalysis } from "@/types/analysis";

export type AnalyzeOutcome =
  | { ok: true; analysis: CareerAnalysis }
  | { ok: false; error: string };

type Kind = "text" | "file";

/** Same-origin serverless API route (backend runs inside this Next.js app). */
const ANALYZE_URL = "/api/analyze";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function handleResponse(res: Response, kind: Kind): Promise<AnalyzeOutcome> {
  if (!res.ok) {
    // Prefer the server's user-safe message; fall back to curated copy.
    let serverMessage = "";
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string") serverMessage = body.error;
    } catch {
      // ignore
    }
    if (serverMessage) return { ok: false, error: serverMessage };
    if (res.status === 422) {
      return { ok: false, error: kind === "file" ? messages.unreadableDocument : messages.shortInput };
    }
    if (res.status === 503) return { ok: false, error: messages.invalidModelResponse };
    return { ok: false, error: messages.aiUnavailable };
  }

  let data: { analysis?: unknown };
  try {
    data = (await res.json()) as { analysis?: unknown };
  } catch {
    return { ok: false, error: messages.invalidModelResponse };
  }

  const adapted = adaptBackendAnalysis(data.analysis);
  const validation = validateCareerAnalysis(adapted);
  return validation.valid
    ? { ok: true, analysis: validation.data }
    : { ok: false, error: messages.invalidModelResponse };
}

/** Analyze pasted CV text (server route calls Hugging Face inference). */
export async function analyzeText(
  cvText: string,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    const res = await fetch(ANALYZE_URL, {
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

/** Analyze an uploaded CV file (PDF/DOCX extraction + inference). */
export async function analyzeFile(
  file: File,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(ANALYZE_URL, { method: "POST", body: form, signal });
    return await handleResponse(res, "file");
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { ok: false, error: messages.networkError };
  }
}
