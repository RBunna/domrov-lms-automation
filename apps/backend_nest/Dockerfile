# ==================== Stage 1: Builder ====================
FROM python:3.11-alpine AS builder

RUN apk add --no-cache gcc musl-dev libffi-dev

WORKDIR /app

# Create virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


# ==================== Stage 2: Production ====================
FROM python:3.11-alpine

# Only runtime dependencies
RUN apk add --no-cache tzdata

ENV TZ=Asia/Phnom_Penh
ENV PATH="/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy venv from builder
COPY --from=builder /venv /venv

# Copy application
COPY . .

# Create runtime cache directory
RUN mkdir -p /files_cache

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN chown -R appuser:appgroup /app /files_cache

USER appuser

EXPOSE 50051

CMD ["python", "main.py"]