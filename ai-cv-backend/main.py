from __future__ import annotations

import asyncio
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from document_service import extract_document_text
from qwen_service import MODEL_NAME, qwen_service
from schemas import (
    AnalyzeFileResponse,
    AnalyzeTextRequest,
    CVAnalysis,
    HealthResponse,
)


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


@app.post(
    "/analyze-text",
    response_model=CVAnalysis,
    tags=["CV Analysis"],
)
async def analyze_text(
    request: AnalyzeTextRequest,
) -> CVAnalysis:
    try:
        # Run CPU-heavy model work outside the async event loop.
        return await asyncio.to_thread(
            qwen_service.analyze,
            request.cvText,
        )

    except ValueError as error:
        # The model could not produce a valid analysis (not a client error).
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "Unexpected analyze-text error:",
            type(error).__name__,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The CV analysis failed. Please try again."
            ),
        ) from error


@app.post(
    "/analyze-file",
    response_model=AnalyzeFileResponse,
    tags=["CV Analysis"],
)
async def analyze_file(
    file: UploadFile = File(...),
) -> AnalyzeFileResponse:
    try:
        file_bytes = await file.read()

        # Extraction problems are client-side (bad/unreadable file) -> 422.
        try:
            extraction = await asyncio.to_thread(
                extract_document_text,
                file.filename or "",
                file_bytes,
            )
        except ValueError as error:
            raise HTTPException(
                status_code=422,
                detail=str(error),
            ) from error

        # Analysis problems are AI-side (incomplete model output) -> 503.
        try:
            analysis = await asyncio.to_thread(
                qwen_service.analyze,
                extraction.text,
            )
        except ValueError as error:
            raise HTTPException(
                status_code=503,
                detail=str(error),
            ) from error

        return AnalyzeFileResponse(
            filename=file.filename or "uploaded-cv",
            fileType=extraction.file_type,
            extractionMethod=extraction.method,
            extractedCharacters=len(extraction.text),
            analysis=analysis,
        )

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Unexpected analyze-file error:",
            type(error).__name__,
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The document could not be processed. "
                "Please try another file."
            ),
        ) from error

    finally:
        await file.close()