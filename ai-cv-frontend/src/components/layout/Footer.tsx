import Link from "next/link";
import { siteConfig } from "@/config/site";
import { PRIVACY_MESSAGE } from "@/components/ui";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card print:hidden">
      <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-muted">
              AI-generated career guidance for students, fresh graduates,
              interns, and junior professionals.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-1">
              {siteConfig.navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 rounded-card-sm border border-border bg-background p-4 text-xs text-muted">
          {PRIVACY_MESSAGE}
        </div>

        <p className="mt-6 text-xs text-muted">
          © {year} {siteConfig.name}. A university final project. Analysis is
          AI-generated and may contain mistakes — use it as guidance, not a
          final decision.
        </p>
      </div>
    </footer>
  );
}
