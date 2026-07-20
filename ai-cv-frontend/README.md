# AI CV Career Advisor — Frontend

The Next.js (App Router) web UI for the AI CV Career Advisor. It collects the
CV, calls the Python backend, validates + adapts the response, stores it in
`sessionStorage`, and renders the career report. See the
[project README](../README.md) for the full picture.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript** (strict, no `any`)
- **Tailwind CSS** design-token system
- **lucide-react** icons
- **jsPDF** for local PDF export (lazy-loaded)
- **Vitest** for unit tests

## Getting started

```bash
npm install
cp .env.example .env.local     # configure the backend URL
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Base URL of the Python backend |
| `NEXT_PUBLIC_USE_MOCK` | `false` | `true` = use built-in demo data, skip the backend |

> Set `NEXT_PUBLIC_USE_MOCK=true` to demo the whole flow without running the
> backend (useful for a quick UI walkthrough).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage (hero, value cards, how-it-works, responsible-AI, about) |
| `/analyze` | Paste/upload CV, validation, loading screen |
| `/results` | Full analysis dashboard (Copy / Print / Download PDF) |
| `/roles/[slug]` | Per-role details: projects + career roadmap |

## Project structure

```
src/
├── app/                    # App Router routes (/, /analyze, /results, /roles/[slug])
├── components/
│   ├── ui/                 # Button, Card, Badge, Alert, EmptyState, SkillTag, …
│   ├── layout/             # Header, Footer, MobileNav, SiteShell
│   ├── home/               # Homepage sections
│   ├── analyze/            # Analyzer panel, tabs, loading screen
│   ├── results/            # Results dashboard + report sections
│   └── roles/              # Role-details view
├── lib/
│   ├── apiClient.ts        # Calls /analyze-text and /analyze-file
│   ├── adaptBackendAnalysis.ts  # Maps backend JSON → rich CareerAnalysis
│   ├── analysisValidation.ts    # Runtime validation of the AI response
│   ├── analysisStorage.ts       # Safe sessionStorage utilities
│   ├── validation.ts       # CV text / file validation
│   ├── reportText.ts       # Plain-text report (Copy)
│   ├── reportPdf.ts        # jsPDF report (Download PDF)
│   └── messages.ts         # Centralized user-facing messages
├── types/analysis.ts       # CareerAnalysis type contract
└── config/                 # site.ts (nav/brand), api.ts (backend URL)
```

## Notes

- The frontend **never trusts raw AI output** — every response is validated
  against the `CareerAnalysis` contract before display.
- No CV content is stored permanently; results use `sessionStorage` only and are
  cleared when you click **Analyze Another CV**.
