# ASL Learning API

FastAPI backend for the ASL Quest mobile app.

## Local development

```bash
cp .env.example .env

# Start Postgres
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres

# Run API
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs: http://localhost:8000/docs

SQLite-only (no Docker): omit `.env` or set `DATABASE_URL=sqlite+aiosqlite:///./asl.db`.

### Connect the Expo app

In `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Use your LAN IP instead of `localhost` on a physical device.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLAlchemy URL (Postgres or SQLite) |
| `POSTGRES_*` | Used by `docker compose` |
| `JWT_SECRET` | Auth token signing key |
| `CORS_ORIGINS` | Comma-separated browser origins |
| `API_DOMAIN` | Hostname for Caddy TLS (production) |
| `RECOGNIZER_IMPL` | `stub` or `asl_rec` |

## Production

On a VPS with Docker, ports 80/443 open, and DNS pointing to the server:

```bash
cp .env.example .env   # set POSTGRES_PASSWORD, JWT_SECRET, API_DOMAIN
docker compose up -d --build
```

Local full stack (no TLS): `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build`

Backup: `docker compose exec postgres pg_dump -U asl asl > backup.sql`

## Tests

```bash
pytest
```

## Sign recognition

Implement `ASLRECRecognizer` in `app/infrastructure/recognition/asl_rec_adapter.py` (ASL-REC branch `origin/1-camera-video-capture`). Set `RECOGNIZER_IMPL=asl_rec`.
