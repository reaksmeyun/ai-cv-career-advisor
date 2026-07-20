import { ArrowRight, Target } from "lucide-react";
import { Badge, Button, Card, SkillTag } from "@/components/ui";
import {
  MATCHING_SKILL_TONE,
  MISSING_SKILL_TONE,
  matchLevelBadge,
} from "@/lib/analysisDisplay";
import type { RecommendedRole } from "@/types/analysis";

export function RecommendedRoles({ roles }: { roles: RecommendedRole[] }) {
  return (
    <section id="recommended-roles" className="scroll-mt-20">
      <div className="flex items-center gap-2.5">
        <Target className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-ink sm:text-xl">
          Recommended entry-level roles
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Three realistic student, internship, apprentice, or junior roles based on
        your CV.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {roles.map((role) => (
          <RoleCard key={role.slug} role={role} />
        ))}
      </div>
    </section>
  );
}

function RoleCard({ role }: { role: RecommendedRole }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{role.title}</h3>
        <Badge variant={matchLevelBadge(role.matchLevel)}>{role.matchLevel} match</Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted">{role.explanation}</p>

      {role.matchingSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Matching skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.matchingSkills.map((skill) => (
              <SkillTag key={skill} tone={MATCHING_SKILL_TONE} className="text-xs">
                {skill}
              </SkillTag>
            ))}
          </div>
        </div>
      )}

      {role.missingSkills.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Skills to strengthen
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.missingSkills.map((skill) => (
              <SkillTag key={skill} tone={MISSING_SKILL_TONE} className="text-xs">
                {skill}
              </SkillTag>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 pt-1">
        <Button
          href={`/roles/${role.slug}`}
          variant="secondary"
          size="sm"
          fullWidth
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          View Career Details
        </Button>
      </div>
    </Card>
  );
}
