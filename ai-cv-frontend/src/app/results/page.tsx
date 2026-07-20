import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata: Metadata = {
  title: "Your Career Analysis",
  description:
    "AI-generated career guidance based on your CV: skills, recommended entry-level roles, skill gaps, and learning steps.",
};

export default function ResultsPage() {
  return <ResultsView />;
}
