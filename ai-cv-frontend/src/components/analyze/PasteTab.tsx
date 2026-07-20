import { FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { MIN_CV_CHARS } from "@/lib/validation";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "Paste your CV content here. Include your education, technical skills, work experience, internships, projects, certifications, and career interests.";

interface PasteTabProps {
  value: string;
  onChange: (value: string) => void;
  onUseExample: () => void;
  onClear: () => void;
}

export function PasteTab({ value, onChange, onUseExample, onClear }: PasteTabProps) {
  const count = value.trim().length;
  const belowMin = count > 0 && count < MIN_CV_CHARS;

  return (
    <div>
      <label htmlFor="cv-text" className="sr-only">
        Paste your CV text
      </label>
      <textarea
        id="cv-text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={14}
        // 16px text prevents mobile zoom-on-focus (responsive requirement).
        className="w-full resize-y rounded-input border border-border bg-card p-4 text-base text-ink placeholder:text-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={cn("text-muted", belowMin && "text-[#b45309]")}>
          {count.toLocaleString()} characters
          {belowMin && ` — at least ${MIN_CV_CHARS} recommended`}
        </span>
        <span className="text-muted">
          Include education, skills, experience, and projects for the best result.
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onUseExample}
          leftIcon={<FileText className="h-4 w-4" aria-hidden="true" />}
        >
          Use Example CV
        </Button>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={onClear}
          disabled={count === 0}
          leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
