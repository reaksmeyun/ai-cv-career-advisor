import { messages } from "./messages";

/** Minimum characters of pasted CV text required to run an analysis. */
export const MIN_CV_CHARS = 200;

/** Maximum accepted upload size (bytes). 5 MB. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Accepted upload MIME types (PDF & DOCX — image OCR isn't available server-side). */
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** Accepted file extensions (fallback when the browser omits a MIME type). */
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx"] as const;

/** `accept` attribute value for the file input. */
export const FILE_ACCEPT_ATTR = [
  ...ACCEPTED_MIME_TYPES,
  ...ACCEPTED_EXTENSIONS,
].join(",");

export interface ValidationResult {
  valid: boolean;
  /** Present when `valid` is false. */
  error?: string;
}

/** Validate pasted CV text against empty / too-short rules. */
export function validateCvText(text: string): ValidationResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: messages.emptyInput };
  }
  if (trimmed.length < MIN_CV_CHARS) {
    return { valid: false, error: messages.shortInput };
  }
  return { valid: true };
}

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Validate an uploaded file's type and size. */
export function validateCvFile(file: File): ValidationResult {
  const typeAccepted =
    (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) ||
    hasAcceptedExtension(file.name);

  if (!typeAccepted) {
    return { valid: false, error: messages.unsupportedFile };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: messages.fileTooLarge };
  }
  if (file.size === 0) {
    return { valid: false, error: messages.unreadableDocument };
  }
  return { valid: true };
}

/** Human-readable file size, e.g. "1.2 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
