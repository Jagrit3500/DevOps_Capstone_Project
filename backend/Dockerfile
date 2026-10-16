# syntax=docker/dockerfile:1
FROM python:3.12-alpine3.24 AS base

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S -G appgroup -H appuser

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY app/ ./app/

# Switch to non-root
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
