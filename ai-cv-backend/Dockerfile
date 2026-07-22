# AI CV Career Advisor API — lightweight remote-inference backend.
# No model weights are downloaded or loaded locally; inference is called on
# Hugging Face Inference Providers, so this image stays small and boots fast.
FROM python:3.11-slim

# System libraries for OCR (Tesseract) and PDF -> image conversion (Poppler).
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        poppler-utils \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOME=/home/appuser

# Run as a non-root user (Hugging Face Spaces convention).
RUN useradd -m -u 1000 appuser

WORKDIR /app

COPY --chown=appuser:appuser requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
