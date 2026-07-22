import mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MIN_CHARS = 50;

/** A user-safe extraction failure (maps to HTTP 422). */
export class ExtractionError extends Error {}

function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract clean text from an uploaded CV. PDF and DOCX are supported on this
 * (serverless) deployment; image OCR is not — it needs a system OCR binary.
 */
export async function extractTextFromFile(
  filename: string,
  bytes: ArrayBuffer,
): Promise<string> {
  if (bytes.byteLength === 0) {
    throw new ExtractionError("The uploaded file is empty.");
  }
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new ExtractionError("The selected file is too large. Please upload a smaller document.");
  }

  const name = filename.toLowerCase();
  let text = "";

  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractPdfText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
  } else if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    text = result.value;
  } else if (/\.(png|jpe?g|webp)$/.test(name)) {
    throw new ExtractionError(
      "Image CVs aren't supported on this deployment. Please paste the CV text or upload a PDF or DOCX file.",
    );
  } else {
    throw new ExtractionError(
      "This file type is not supported. Upload a PDF or DOCX file, or paste the CV text.",
    );
  }

  const cleaned = cleanText(text);
  if (cleaned.length < MIN_CHARS) {
    throw new ExtractionError(
      "We could not extract enough readable text from this file. Try another file or paste the CV text.",
    );
  }
  return cleaned;
}
