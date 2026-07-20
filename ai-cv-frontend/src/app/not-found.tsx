import { Compass } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={<Compass className="h-7 w-7" aria-hidden="true" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
      >
        <Button href="/" variant="gradient">
          Back to home
        </Button>
        <Button href="/analyze" variant="secondary">
          Analyze a CV
        </Button>
      </EmptyState>
    </section>
  );
}
