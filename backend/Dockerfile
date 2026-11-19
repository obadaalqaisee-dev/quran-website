# Production image for the API. The website itself is served by GitHub Pages.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    ENVIRONMENT=production \
    DATABASE_URL=sqlite:////srv/data/quran.sqlite3

WORKDIR /srv/backend
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

# Build the read-only reference database at image build time; the seed step
# refuses to run if any dataset checksum does not match.
RUN mkdir -p /srv/data \
    && alembic upgrade head \
    && python -m app.cli seed \
    && useradd --system --uid 10001 --home /srv appuser \
    && chown -R appuser /srv/data

USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=4).status == 200 else 1)"

# --forwarded-allow-ips: trust X-Forwarded-For from the platform's proxy so
# that rate limiting sees the real client address.
CMD ["sh", "-c", "gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w ${WEB_CONCURRENCY:-2} -b 0.0.0.0:${PORT:-8000} --forwarded-allow-ips='*' --access-logfile - --timeout 30"]
