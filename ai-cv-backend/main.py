from __future__ import annotations

import os
import time
import uuid
from threading import Lock, Thread
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from document_service import extract_document_text
from qwen_service import MODEL_NAME, qwen_service
from schemas import AnalyzeTextRequest, HealthResponse


app = FastAPI(
    title="AI CV Career Advisor API",
    description=(
        "Extracts CV content and generates structured "
        "career guidance using Qwen2.5."
    ),
    version="1.0.0",
)

# Allowed frontend origins. Set ALLOWED_ORIGINS (comma-separated) in production
# to include your deployed frontend URL, e.g.
#   ALLOWED_ORIGINS=https://your-app.vercel.app
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get(
    "/",
    tags=["System"],
)
def root() -> dict[str, str]:
    return {
        "message": "AI CV Career Advisor API is running.",
        "docs": "/docs",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
)
def health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        model=MODEL_NAME,
        device="cpu",
    )


# ------------------------------------------------------------------ #
# Async job model.
#
# CPU inference of the model can take minutes, which is longer than many
# hosting proxies keep an HTTP request open. So analysis runs in a background
# thread: the POST endpoints return a job id immediately, and the client polls
# GET /jobs/{id} until the job is done. This keeps every request short.
# ------------------------------------------------------------------ #

_jobs: dict[str, dict[str, Any]] = {}
_jobs_lock = Lock()
_MAX_JOBS = 200


def _set_job(job_id: str, **fields: Any) -> None:
    with _jobs_lock:
        job = _jobs.get(job_id, {})
        job.update(fields)
        _jobs[job_id] = job

        # Evict the oldest jobs if the store grows too large.
        if len(_jobs) > _MAX_JOBS:
            oldest = sorted(_jobs, key=lambda key: _jobs[key].get("createdAt", 0))
            for key in oldest[: len(_jobs) - _MAX_JOBS]:
                _jobs.pop(key, None)


def _new_job() -> str:
    job_id = uuid.uuid4().hex
    _set_job(job_id, status="pending", createdAt=time.time())
    return job_id


def _run_text_job(job_id: str, cv_text: str) -> None:
    try:
        analysis = qwen_service.analyze(cv_text)
        _set_job(job_id, status="done", result=analysis.model_dump())
    except ValueError as error:
        _set_job(job_id, status="error", code=503, detail=str(error))
    except Exception as error:
        print("analyze-text job error:", type(error).__name__, error)
        _set_job(
            job_id,
            status="error",
            code=500,
            detail="The CV analysis failed. Please try again.",
        )


def _run_file_job(job_id: str, filename: str, file_bytes: bytes) -> None:
    try:
        # Extraction problems are client-side (bad/unreadable file) -> 422.
        try:
            extraction = extract_document_text(filename, file_bytes)
        except ValueError as error:
            _set_job(job_id, status="error", code=422, detail=str(error))
            return

        # Analysis problems are AI-side (incomplete model output) -> 503.
        analysis = qwen_service.analyze(extraction.text)
        _set_job(job_id, status="done", result=analysis.model_dump())
    except ValueError as error:
        _set_job(job_id, status="error", code=503, detail=str(error))
    except Exception as error:
        print("analyze-file job error:", type(error).__name__, error)
        _set_job(
            job_id,
            status="error",
            code=500,
            detail="The document could not be processed. Please try another file.",
        )


@app.post("/analyze-text", tags=["CV Analysis"])
async def analyze_text(request: AnalyzeTextRequest) -> dict[str, str]:
    job_id = _new_job()
    Thread(
        target=_run_text_job,
        args=(job_id, request.cvText),
        daemon=True,
    ).start()
    return {"jobId": job_id, "status": "pending"}


@app.post("/analyze-file", tags=["CV Analysis"])
async def analyze_file(file: UploadFile = File(...)) -> dict[str, str]:
    try:
        file_bytes = await file.read()
    finally:
        await file.close()

    job_id = _new_job()
    Thread(
        target=_run_file_job,
        args=(job_id, file.filename or "", file_bytes),
        daemon=True,
    ).start()
    return {"jobId": job_id, "status": "pending"}


@app.get("/jobs/{job_id}", tags=["CV Analysis"])
def get_job(job_id: str) -> dict[str, Any]:
    with _jobs_lock:
        job = dict(_jobs[job_id]) if job_id in _jobs else None

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis job not found or expired.",
        )

    job.pop("createdAt", None)
    return job