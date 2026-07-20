---
title: AI CV Career Advisor API
emoji: 📄
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# AI CV Career Advisor — Backend

FastAPI service that extracts text from a CV, runs the **Qwen2.5-1.5B-Instruct**
model (locally, via llama.cpp), validates the output, and returns structured
career-analysis JSON. See the [project README](../README.md) for the full
picture.

## Tech stack

- **FastAPI** + **uvicorn**
- **llama-cpp-python** running **Qwen2.5-1.5B-Instruct** (GGUF, `Q4_K_M`)
- **pypdf** (PDF), **python-docx** (DOCX), **pdf2image** + **pytesseract** +
  **Pillow** (image / scanned-PDF OCR)
- **json-repair** for tolerant parsing of model output

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` uses a prebuilt CPU wheel index for `llama-cpp-python`, so no
C++ compiler is required.

### System dependency (for image / scanned-PDF OCR)

Text paste and text-based PDFs/DOCX work without it. For **image** CVs or
scanned PDFs you need the Tesseract binary:

```bash
sudo apt-get install -y tesseract-ocr        # Debian/Ubuntu
```

## Run

```bash
uvicorn main:app --port 8000
```

- The **first run downloads the ~1 GB GGUF model** to the Hugging Face cache;
  subsequent starts load it in seconds.
- Wait for **`Qwen model is ready.`** before sending requests.
- Interactive API docs: <http://localhost:8000/docs>

## API

Analysis is **asynchronous** (CPU inference can take minutes): the `POST`
endpoints start a background job and return a `jobId`; the client polls
`GET /jobs/{id}` until it is `done`.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET` | `/health` | – | `{ status, model, device }` |
| `POST` | `/analyze-text` | `{ "cvText": "..." }` (≥100 chars) | `{ jobId, status }` |
| `POST` | `/analyze-file` | `multipart/form-data` field `file` | `{ jobId, status }` |
| `GET` | `/jobs/{id}` | – | `{ status: pending \| done \| error, result?, code? }` |

### Error semantics

A failed job returns `{ "status": "error", "code": <n>, "detail": "..." }`:

| `code` | Meaning |
|--------|---------|
| `422` | Bad input — unreadable/unsupported/oversized file |
| `503` | The AI could not produce a valid analysis (after bounded retries) |
| `500` | Unexpected server error |

## How it works

1. **Validate** file type, size, and content (see `document_service.py`).
2. **Extract** text — pypdf / python-docx / OCR — then clean and normalize it.
3. **Analyze** with Qwen (`qwen_service.py`): a strict JSON prompt, grammar-
   constrained JSON output, then robust post-processing:
   - strip code fences / trailing commas, repair malformed JSON
   - recover mangled field-name keys (aliases)
   - validate against the schema; **bounded retries** (no infinite loop)
4. **Return** structured JSON. Uploaded files are held in memory only and are
   never written to disk.

## Project structure

```
ai-cv-backend/
├── main.py                 # FastAPI app + endpoints + CORS
├── schemas.py              # Pydantic response models (CVAnalysis, …)
├── document_service.py     # PDF / DOCX / OCR extraction + validation
├── qwen_service.py         # llama.cpp model load, prompt, parse, validate, retry
├── test_qwen.py            # Standalone model smoke-test script
└── requirements.txt
```

## Configuration

Key constants live at the top of `qwen_service.py`:

| Constant | Default | Purpose |
|----------|---------|---------|
| `MODEL_REPO` / `MODEL_FILE` | Qwen2.5-1.5B GGUF `Q4_K_M` | Which model to load |
| `N_CTX` | `4096` | Context window |
| `MAX_NEW_TOKENS` | `900` | Generation cap (raise for longer output, lower for speed) |
| `MAX_ATTEMPTS` | `3` | Bounded retries on malformed output |

CORS currently allows `http://localhost:3000` (see `main.py`). Update it for
other frontend origins.

## Notes on performance

- CPU inference of the 1.5B model takes roughly **1–3 minutes** per analysis.
- The `Q4_K_M` GGUF uses about **2–2.5 GB** of RAM. For faster results, run on a
  GPU or use a larger model — only `MODEL_REPO` / `MODEL_FILE` need to change.
