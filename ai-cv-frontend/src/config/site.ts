/**
 * Single source of truth for site-wide chrome (nav, brand).
 * Keeping this here avoids duplicating nav arrays across Header/Footer/MobileNav.
 */
export interface NavItem {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "AI CV Career Advisor",
  tagline: "AI-Powered Career Guidance",
  /** Homepage anchor links resolve to sections built in Stage 3. */
  navItems: [
    { label: "Home", href: "/" },
    { label: "Analyze CV", href: "/analyze" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Career Resources", href: "/#resources" },
    { label: "About", href: "/#about" },
  ] satisfies NavItem[],
  /** Primary call-to-action used in the header. */
  primaryCta: { label: "Try CV Analyzer", href: "/analyze" } satisfies NavItem,
} as const;
