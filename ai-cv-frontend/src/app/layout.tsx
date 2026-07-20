import type { Metadata, Viewport } from "next";
import { Inter, Kantumruy_Pro } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

// Primary UI font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Optional Khmer support (Stage 2 language toggle is a UI prototype for now)
const kantumruyPro = Kantumruy_Pro({
  variable: "--font-kantumruy",
  subsets: ["khmer", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI CV Career Advisor",
    template: "%s · AI CV Career Advisor",
  },
  description:
    "Paste or upload your CV and receive AI-generated skill analysis, suitable entry-level job recommendations, missing-skill insights, and practical learning suggestions.",
  applicationName: "AI CV Career Advisor",
  keywords: [
    "CV analysis",
    "career advisor",
    "AI career guidance",
    "entry-level jobs",
    "skill gap analysis",
    "student career",
  ],
  authors: [{ name: "AI CV Career Advisor" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${kantumruyPro.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-primary focus:px-4 focus:py-2 focus:text-white print:hidden"
        >
          Skip to main content
        </a>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
