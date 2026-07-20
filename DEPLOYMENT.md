# Deployment guide

The app deploys as two independent services:

- **Frontend** → **Vercel** (free)
- **Backend** → **Hugging Face Spaces** (free Docker Space, 16 GB RAM)

The browser calls the backend directly, so CORS must allow your Vercel URL.

> **Order matters (chicken-and-egg):** deploy the **backend first** to get its
> URL, deploy the **frontend** with that URL, then set the backend's
> `ALLOWED_ORIGINS` to your Vercel URL and restart the Space.

---

## Part A — Backend on Hugging Face Spaces

### 1. Create the Space

1. Sign in at <https://huggingface.co> → **New → Space**.
2. Name: `ai-cv-backend` · **SDK: Docker** · Hardware: **CPU basic (free)** ·
   Visibility: Public.

### 2. Push the backend code to the Space

A Space is its own git repo. Push the **contents of `ai-cv-backend/`** to the
Space root (so `Dockerfile`, `README.md`, `main.py`, … sit at the top level):

```bash
git clone https://huggingface.co/spaces/<your-username>/ai-cv-backend hf-space
cp -r ai-cv-backend/. hf-space/          # includes Dockerfile, .dockerignore, README
cd hf-space
git add .
git commit -m "Deploy AI CV Career Advisor backend"
git push                                  # use your HF username + an access token
```

> Create a write token at <https://huggingface.co/settings/tokens> and use it as
> the password when git prompts.

The Space's `README.md` already contains the required Hugging Face metadata
(`sdk: docker`, `app_port: 7860`).

### 3. First build

- The Space builds the Docker image, then on first start **downloads the ~1 GB
  model** — allow **2–3 minutes** before it shows **Running**.
- Test it: open `https://<your-username>-ai-cv-backend.hf.space/health` — you
  should see `{"status":"healthy", ...}`.
- Note this base URL — you'll give it to the frontend next.

### 4. Allow your frontend (do after Part B)

In the Space → **Settings → Variables and secrets** → add a **Variable**:

```
ALLOWED_ORIGINS = https://<your-app>.vercel.app
```

Then **Restart** the Space.

---

## Part B — Frontend on Vercel

### 1. Import the project

1. Push this repo to GitHub (already at
   `github.com/reaksmeyun/ai-cv-career-advisor`).
2. At <https://vercel.com> → **Add New → Project** → import the repo.
3. **Root Directory: `ai-cv-frontend`** (important — it's a monorepo).
   Vercel auto-detects Next.js.

### 2. Environment variables

Add these in the Vercel project settings (Production):

```
NEXT_PUBLIC_API_BASE_URL = https://<your-username>-ai-cv-backend.hf.space
NEXT_PUBLIC_USE_MOCK      = false
```

### 3. Deploy

Click **Deploy**. When it finishes, copy the Vercel URL (e.g.
`https://ai-cv-career-advisor.vercel.app`).

### 4. Close the loop

Go back to **Part A step 4**, set `ALLOWED_ORIGINS` on the Space to your Vercel
URL, and restart the Space. Your live site can now call the backend.

---

## Verify end-to-end

1. Open your Vercel URL → **Analyze CV** → **Use Example CV** → **Analyze**.
2. The browser calls your HF Space; results appear after the analysis finishes.

---

## Important notes

- **Free HF CPU is 2 vCPU**, so an analysis may take **2–5 minutes** — but the
  backend already uses an async **job + polling** pattern: `POST /analyze-text`
  / `POST /analyze-file` return a `jobId` immediately, and the frontend polls
  `GET /jobs/{id}` until it's done. No single request stays open long enough to
  hit a proxy timeout.
- **The free Space sleeps** after inactivity; the next request triggers a cold
  start (image boot + model load, ~2–3 min) before it responds.
- **No secrets in the frontend.** `NEXT_PUBLIC_*` values are public by design;
  they only contain the backend URL and the mock flag — never tokens.
- **Demo fallback:** set `NEXT_PUBLIC_USE_MOCK=true` on Vercel to show the full
  UI with example data if the backend is asleep or unavailable during a demo.
