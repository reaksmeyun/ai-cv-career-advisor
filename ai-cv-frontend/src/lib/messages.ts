/**
 * Centralized user-facing messages (Stage 14 error & empty states).
 * Keeping them here keeps copy consistent and unit-testable.
 */
export const messages = {
  emptyInput: "Add your CV content to begin the analysis.",
  shortInput:
    "Please provide more information about your education, experience, projects, or skills.",
  unsupportedFile:
    "This file type is not supported. Upload a PDF, DOCX, PNG, JPG, or JPEG file.",
  fileTooLarge:
    "The selected file is too large. Please upload a smaller document.",
  unreadableDocument:
    "We could not extract enough readable text from this file. Try another file or paste the CV text.",
  aiUnavailable:
    "The analysis service is currently unavailable. Please try again.",
  invalidModelResponse:
    "The AI returned an incomplete result. Please run the analysis again.",
  networkError: "Check your internet connection and try again.",
  missingResult:
    "Your analysis is no longer available in this session. Please analyze your CV again.",
} as const;

export type MessageKey = keyof typeof messages;
