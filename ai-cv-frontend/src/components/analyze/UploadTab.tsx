"use client";

import { useId, useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Alert } from "@/components/ui";
import { FILE_ACCEPT_ATTR, formatFileSize, validateCvFile } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface UploadTabProps {
  file: File | null;
  error: string | null;
  onFileAccepted: (file: File) => void;
  onFileRejected: (error: string) => void;
  onRemove: () => void;
}

export function UploadTab({
  file,
  error,
  onFileAccepted,
  onFileRejected,
  onRemove,
}: UploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  function handleFiles(files: FileList | null) {
    const selected = files?.[0];
    if (!selected) return;
    const result = validateCvFile(selected);
    if (result.valid) {
      onFileAccepted(selected);
    } else {
      onFileRejected(result.error ?? "This file could not be used.");
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  if (file) {
    const isImage = file.type.startsWith("image/");
    return (
      <div>
        <div className="flex items-center gap-3 rounded-input border border-border bg-card p-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-card-sm bg-primary/10 text-primary">
            {isImage ? (
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FileText className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-button text-muted hover:bg-background hover:text-error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Ready to analyze. The file is processed only to extract text — it is not
          permanently stored.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${inputId}-hint`}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-background/60 hover:border-primary/60",
        )}
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium text-ink">
          Drag &amp; drop your CV here, or{" "}
          <span className="text-primary underline">browse</span>
        </p>
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted">
          PDF, DOCX, PNG, JPG, or JPEG — up to 5 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT_ATTR}
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <Alert variant="error" className="mt-4" title="Upload error">
          {error}
        </Alert>
      )}
    </div>
  );
}
