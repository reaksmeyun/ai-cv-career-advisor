---
title: AI CV Career Advisor API
emoji: 📄
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AI CV Career Advisor — Backend (remote inference)

Lightweight FastAPI service that extracts text from a CV (pasted text, PDF, DOCX,
or image), validates it, and generates structured career-analysis JSON by calling
**Hugging Face Inference Providers** — no model weights are loaded locally.

## Architecture

```
Next.js frontend
  → FastAPI backend (this service)
    → extract text (pasted / PDF / DOCX / image OCR)
    → clean + validate
    → Hugging Face Inference Providers  (InferenceClient, provider="auto")
    → validate structured JSON
  → return analysis to the frontend
```

## Tech stack

- **FastAPI** + **uvicorn**
- **huggingface-hub** `InferenceClient` (remote inference — no local Torch/GGUF)
- **pypdf** (PDF), **python-docx** (DOCX), **pdf2image** + **pytesseract** +
  **Pillow** (image / scanned-PDF OCR)
- **json-repair** for tolerant parsing of model output

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `HF_TOKEN` | yes (for analysis) | – | Hugging Face token with Inference Providers access |
| `MODEL_ID` | no | `Qwen/Qwen2.5-1.5B-Instruct` | Model to call via Inference Providers |
| `ALLOWED_ORIGINS` | no | `http://localhost:3000,...` | Comma-separated allowed CORS origins |
| `FRONTEND_URL` | no | – | A single production frontend origin to allow |

> `/health` works even without `HF_TOKEN`; analysis requests return a clear
> error until the token is set.

## Run locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export HF_TOKEN=hf_your_token_here          # from https://huggingface.co/settings/tokens
uvicorn main:app --reload --port 8000
```

- API docs: <http://localhost:8000/docs>
- Health:   <http://localhost:8000/health>

For image / scanned-PDF OCR you also need Tesseract locally:
`sudo apt-get install -y tesseract-ocr poppler-utils`.

## Run with Docker

```bash
docker build -t ai-cv-backend .
docker run -p 7860:7860 -e HF_TOKEN=hf_your_token_here ai-cv-backend
```

## Hugging Face Space

1. Create a **Docker** Space and push this folder to it.
2. **Settings → Variables and secrets** → add secret **`HF_TOKEN`** (and
   optionally `MODEL_ID`, `FRONTEND_URL`).
3. The Space builds and starts quickly (no model download).

## API

Analysis is **asynchronous** (submit → poll):

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET` | `/health` | – | `{ status, modelMode, modelId, tokenConfigured }` |
| `POST` | `/analyze-text` | `{ "cvText": "..." }` | `{ jobId, status }` |
| `POST` | `/analyze-file` | `multipart/form-data` field `file` | `{ jobId, status }` |
| `GET` | `/jobs/{id}` | – | `{ status: pending \| done \| error, result?, code? }` |

A failed job returns `{ "status": "error", "code": <n>, "detail": "..." }`:

| `code` | Meaning |
|--------|---------|
| `422` | Bad input — unreadable/unsupported file |
| `502` | Remote inference provider/token failure |
| `503` | The AI produced an incomplete/invalid analysis |
| `500` | Unexpected server error |

Tokens, stack traces, and local paths are never exposed in API responses.
