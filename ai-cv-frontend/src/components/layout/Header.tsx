"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string): boolean {
    // Anchor links (/#...) belong to the homepage.
    const base = href.split("#")[0] || "/";
    if (base === "/") return pathname === "/" && !href.includes("#");
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-button px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span
            className="hidden items-center text-muted lg:inline-flex"
            title="Privacy-first: your CV is not permanently stored"
          >
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Privacy-first</span>
          </span>
          <Button
            href={siteConfig.primaryCta.href}
            variant="gradient"
            size="md"
            className="hidden sm:inline-flex"
          >
            {siteConfig.primaryCta.label}
          </Button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-button text-ink hover:bg-background md:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
