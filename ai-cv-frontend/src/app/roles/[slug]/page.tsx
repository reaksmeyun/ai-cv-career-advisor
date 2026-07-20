import type { Metadata } from "next";
import { RoleDetailView } from "@/components/roles/RoleDetailView";

interface RolePageProps {
  params: Promise<{ slug: string }>;
}

/** Turn a slug like "junior-frontend-developer" into "Junior Frontend Developer". */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: RolePageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = humanizeSlug(slug) || "Role Details";
  return {
    title: `${title} · Role Details`,
    description: `Career details, suggested projects, and a roadmap for the ${title} role.`,
  };
}

export default async function RolePage({ params }: RolePageProps) {
  const { slug } = await params;
  return <RoleDetailView slug={slug} />;
}
