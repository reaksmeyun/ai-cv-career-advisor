import { apiUrl } from "@/config/api";
import { adaptBackendAnalysis } from "@/lib/adaptBackendAnalysis";
import { validateCareerAnalysis } from "@/lib/analysisValidation";
import { messages } from "@/lib/messages";
import type { CareerAnalysis } from "@/types/analysis";

export type AnalyzeOutcome =
  | { ok: true; analysis: CareerAnalysis }
  | { ok: false; error: string };

type JobKind = "text" | "file";

/** How often to poll the job status, and a safety cap on total wait. */
const POLL_INTERVAL_MS = 2500;
const MAX_POLL_MS = 10 * 60 * 1000;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Sleep that rejects immediately if the signal aborts. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function mapJobError(code: unknown, kind: JobKind): string {
  if (code === 422) {
    return kind === "file" ? messages.unreadableDocument : messages.shortInput;
  }
  if (code === 503) return messages.invalidModelResponse;
  return messages.aiUnavailable;
}

/** Poll GET /jobs/{id} until the analysis finishes, errors, or times out. */
async function pollJob(
  jobId: string,
  kind: JobKind,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS, signal); // throws AbortError if cancelled

    let res: Response;
    try {
      res = await fetch(apiUrl(`/jobs/${jobId}`), { signal });
    } catch (error) {
      if (isAbortError(error)) throw error;
      continue; // transient network blip — keep polling
    }

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: messages.aiUnavailable };
      }
      continue;
    }

    const job = (await res.json()) as {
      status?: string;
      result?: unknown;
      code?: number;
    };

    if (job.status === "done") {
      const adapted = adaptBackendAnalysis(job.result);
      const validation = validateCareerAnalysis(adapted);
      return validation.valid
        ? { ok: true, analysis: validation.data }
        : { ok: false, error: messages.invalidModelResponse };
    }

    if (job.status === "error") {
      return { ok: false, error: mapJobError(job.code, kind) };
    }
    // status "pending" → keep polling
  }

  return { ok: false, error: messages.aiUnavailable };
}

/** Start a job and return its id, or map a submit-time HTTP error. */
async function startJob(
  path: string,
  init: RequestInit,
  kind: JobKind,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  const res = await fetch(apiUrl(path), { ...init, signal });

  if (!res.ok) {
    if (res.status === 422) {
      return {
        ok: false,
        error: kind === "file" ? messages.unreadableDocument : messages.shortInput,
      };
    }
    return { ok: false, error: messages.aiUnavailable };
  }

  const data = (await res.json()) as { jobId?: string };
  if (!data.jobId) {
    return { ok: false, error: messages.aiUnavailable };
  }

  return pollJob(data.jobId, kind, signal);
}

/** Send pasted CV text to the backend for analysis (async job + polling). */
export async function analyzeText(
  cvText: string,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    return await startJob(
      "/analyze-text",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText }),
      },
      "text",
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { ok: false, error: messages.networkError };
  }
}

/** Upload a CV file for extraction + analysis (async job + polling). */
export async function analyzeFile(
  file: File,
  signal?: AbortSignal,
): Promise<AnalyzeOutcome> {
  try {
    const form = new FormData();
    form.append("file", file);
    return await startJob(
      "/analyze-file",
      { method: "POST", body: form },
      "file",
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { ok: false, error: messages.networkError };
  }
}
