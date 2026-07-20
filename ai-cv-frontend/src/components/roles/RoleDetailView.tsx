"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileSearch,
  FolderGit2,
  ListChecks,
  Route,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, SkillTag, Spinner } from "@/components/ui";
import {
  SSR_SENTINEL,
  getResultServerSnapshot,
  getResultSnapshot,
  parseResultRaw,
  subscribeResult,
  type LoadedResult,
} from "@/lib/analysisStorage";
import {
  MATCHING_SKILL_TONE,
  MISSING_SKILL_TONE,
  levelBadge,
  matchLevelBadge,
} from "@/lib/analysisDisplay";
import { messages } from "@/lib/messages";
import type { RecommendedRole, SuggestedProject } from "@/types/analysis";

export function RoleDetailView({ slug }: { slug: string }) {
  const snapshot = useSyncExternalStore(
    subscribeResult,
    getResultSnapshot,
    getResultServerSnapshot,
  );

  const state: LoadedResult | "loading" = useMemo(
    () => (snapshot === SSR_SENTINEL ? "loading" : parseResultRaw(snapshot)),
    [snapshot],
  );

  if (state === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading role details" />
      </div>
    );
  }

  // No analysis in this session.
  if (state.status !== "ok") {
    return (
      <FallbackState
        title="No analysis found"
        message={
          state.status === "invalid"
            ? messages.invalidModelResponse
            : messages.missingResult
        }
        href="/analyze"
        cta="Analyze a CV"
      />
    );
  }

  const role = state.result.analysis.recommendedRoles.find((r) => r.slug === slug);

  // Unknown / missing slug — handled gracefully.
  if (!role) {
    return (
      <FallbackState
        title="Role not found"
        message="We couldn't find that role in your current analysis. It may have been from a previous session."
        href="/results"
        cta="Back to results"
      />
    );
  }

  return <RoleDetail role={role} />;
}

function RoleDetail({ role }: { role: RecommendedRole }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to results
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {role.title}
        </h1>
        <Badge variant={matchLevelBadge(role.matchLevel)}>{role.matchLevel} match</Badge>
      </header>

      <p className="mt-4 text-muted">{role.roleDescription}</p>

      {/* Why the role fits */}
      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
          Why this role fits
        </h2>
        <p className="mt-3 text-muted">{role.explanation}</p>
      </Card>

      {/* Skills */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Current matching skills
          </h2>
          {role.matchingSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.matchingSkills.map((skill) => (
                <SkillTag key={skill} tone={MATCHING_SKILL_TONE}>
                  {skill}
                </SkillTag>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">None detected yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Skills to strengthen
          </h2>
          {role.missingSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.missingSkills.map((skill) => (
                <SkillTag key={skill} tone={MISSING_SKILL_TONE}>
                  {skill}
                </SkillTag>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No major gaps identified.</p>
          )}
        </Card>
      </div>

      {/* Suggested projects */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl">
          <FolderGit2 className="h-5 w-5 text-primary" aria-hidden="true" />
          Suggested projects
        </h2>
        <p className="mt-1 text-sm text-muted">
          Build these to demonstrate the skills this role needs.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role.suggestedProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>

      {/* Career roadmap */}
      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl">
          <Route className="h-5 w-5 text-primary" aria-hidden="true" />
          Career roadmap
        </h2>
        <ol className="mt-4 space-y-3">
          {role.roadmap.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-card-sm border border-border bg-card p-4"
            >
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ai-gradient text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="pt-0.5 text-sm text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <Button href="/results" variant="secondary" leftIcon={<ListChecks className="h-4 w-4" />}>
          Back to full results
        </Button>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: SuggestedProject }) {
  return (
    <Card size="sm" className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink">{project.title}</h3>
        <Badge variant={levelBadge(project.difficulty)}>{project.difficulty}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted">
        <span className="font-medium text-ink">Goal: </span>
        {project.goal}
      </p>
      {project.skillsPracticed.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skillsPracticed.map((skill) => (
            <SkillTag key={skill} tone="primary" className="text-xs">
              {skill}
            </SkillTag>
          ))}
        </div>
      )}
    </Card>
  );
}

function FallbackState({
  title,
  message,
  href,
  cta,
}: {
  title: string;
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <EmptyState
        tone="warning"
        icon={<FileSearch className="h-7 w-7" aria-hidden="true" />}
        title={title}
        description={message}
      >
        <Button href={href} variant="gradient">
          {cta}
        </Button>
      </EmptyState>
    </section>
  );
}
