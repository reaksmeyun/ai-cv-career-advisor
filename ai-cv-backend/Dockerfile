# AI CV Career Advisor — backend image (Hugging Face Space / any Docker host)
FROM python:3.12-slim

# System dependencies: Tesseract (OCR) + Poppler (PDF -> image for scanned PDFs)
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user (Hugging Face Spaces convention) with a writable
# Hugging Face cache directory for the downloaded GGUF model.
RUN useradd -m -u 1000 appuser
ENV HOME=/home/appuser \
    HF_HOME=/home/appuser/.cache/huggingface \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

COPY --chown=appuser:appuser requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 7860

# The model (~1 GB GGUF) downloads on first startup and is cached in HF_HOME.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
