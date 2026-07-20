import { describe, expect, it } from "vitest";
import { messages } from "@/lib/messages";
import {
  MAX_FILE_BYTES,
  MIN_CV_CHARS,
  formatFileSize,
  validateCvFile,
  validateCvText,
} from "@/lib/validation";

/** Build a File-like object without depending on the DOM File constructor. */
function fakeFile(name: string, type: string, size: number): File {
  return { name, type, size } as unknown as File;
}

describe("validateCvText", () => {
  it("rejects empty input", () => {
    const result = validateCvText("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe(messages.emptyInput);
  });

  it("rejects input shorter than the minimum", () => {
    const result = validateCvText("Too short");
    expect(result.valid).toBe(false);
    expect(result.error).toBe(messages.shortInput);
  });

  it("accepts input at or above the minimum", () => {
    const result = validateCvText("a".repeat(MIN_CV_CHARS));
    expect(result.valid).toBe(true);
  });
});

describe("validateCvFile", () => {
  it("accepts a PDF within the size limit", () => {
    expect(validateCvFile(fakeFile("cv.pdf", "application/pdf", 1024)).valid).toBe(true);
  });

  it("accepts a file matched by extension when MIME type is empty", () => {
    expect(validateCvFile(fakeFile("cv.docx", "", 2048)).valid).toBe(true);
  });

  it("rejects an unsupported type", () => {
    const result = validateCvFile(fakeFile("cv.txt", "text/plain", 500));
    expect(result.valid).toBe(false);
    expect(result.error).toBe(messages.unsupportedFile);
  });

  it("rejects a file over the size limit", () => {
    const result = validateCvFile(fakeFile("cv.pdf", "application/pdf", MAX_FILE_BYTES + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toBe(messages.fileTooLarge);
  });

  it("rejects an empty file", () => {
    const result = validateCvFile(fakeFile("cv.pdf", "application/pdf", 0));
    expect(result.valid).toBe(false);
    expect(result.error).toBe(messages.unreadableDocument);
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
