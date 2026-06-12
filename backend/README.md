# ASL Academy — Backend API

FastAPI backend for the ASL Academy client. Handles authentication, curriculum, lesson progress, sign recognition, gamification, Stripe billing, and admin operations.

## Architecture

The backend follows a layered clean-architecture layout:

```mermaid
flowchart TB
  presentation[Presentation_FastAPI_routes_schemas]
  application[Application_services]
  domain[Domain_entities_and_ports]
  infrastructure[Infrastructure_SQLAlchemy_JWT_recognizers]
  presentation --> application --> domain
  infrastructure --> domain
```

| Layer | Path | Responsibility |
| --- | --- | --- |
| Presentation | `app/presentation/` | HTTP routes, request/response schemas, dependency injection |
| Application | `app/application/` | Business logic services (auth, lessons, billing, recognition, etc.) |
| Domain | `app/domain/` | Entities, value objects, and repository/recognizer port interfaces |
| Infrastructure | `app/infrastructure/` | SQLAlchemy repositories, JWT, bcrypt, recognition adapters |

Recognition is pluggable via `app/domain/ports/sign_recognizer.py`. The factory in `app/infrastructure/recognition/factory.py` selects `stub` or `asl_rec` based on `RECOGNIZER_IMPL`.

## API overview

All routes are mounted under `/api/v1` (configurable via `API_PREFIX`).

| Module | Prefix | Purpose |
| --- | --- | --- |
| `auth` | `/auth` | Register, login, logout |
| `me` | `/me` | Current user profile and progress |
| `curriculum` | `/curriculum` | Published units and lesson catalog |
| `lessons` | `/lessons` | Lesson detail, exercise attempts, completion |
| `challenges` | `/challenges` | Weekly challenge claims |
| `signs` | `/signs` | Camera sign recognition |
| `billing` | `/billing` | Stripe plans, checkout, cancel, webhooks |
| `admin` | `/admin` | Metrics overview and curriculum CRUD |

Interactive docs: `GET /docs` (Swagger UI).

Health check: `GET /health` (does not verify database or recognizer connectivity).

## Local development

```bash
cp .env.example .env

python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python -m scripts.seed_curriculum
python -m scripts.seed_demo_users   # optional: demo users for admin metrics
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs: http://localhost:8000/docs

**SQLite (no Postgres needed):** omit `.env` or set `DATABASE_URL=sqlite+aiosqlite:///./asl.db`.

### Connect the Expo app

In `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Use your LAN IP instead of `localhost` on a physical device.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy URL (Postgres or SQLite) |
| `JWT_SECRET` | Auth token signing key |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `RECOGNIZER_IMPL` | `stub` or `asl_rec` |
| `ASL_REC_URL` | Upstream recognizer endpoint (default `http://172.20.70.2:5000/predict`) |
| `ASL_REC_TIMEOUT_SECONDS` | HTTP timeout for upstream recognition requests |

Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.) are required when billing endpoints are used.

## Database

Production uses **PostgreSQL 15** on `salva-db` (`172.20.70.144`), database `asl`. All schema changes are managed by **Alembic** migrations — startup does not call `create_all()`.

See [DATABASE.md](DATABASE.md) for the normalized entity model, design goals, and indexing strategy.

### Seed scripts

| Script | Purpose |
| --- | --- |
| `scripts/seed_curriculum.py` | Units, lessons, exercises, and challenges |
| `scripts/seed_demo_users.py` | Demo users with progress data (for admin metrics) |
| `scripts/make_admin.py` | Promote an existing user to admin |

## Tests

```bash
pytest
```

Tests use an in-memory SQLite database (see `tests/conftest.py`).

## Sign recognition

The backend supports two recognizer implementations:

- **`stub`** — Returns deterministic results for local development and tests.
- **`asl_rec`** — HTTP adapter (`app/infrastructure/recognition/asl_rec_adapter.py`) that forwards frames to the on-prem service at `172.20.70.2:5000`.

Production configuration in `/etc/asl-backend.env`:

```env
RECOGNIZER_IMPL=asl_rec
ASL_REC_URL=http://172.20.70.2:5000/predict
ASL_REC_TIMEOUT_SECONDS=10
```

### HTTP contract

The adapter sends:

```json
{
  "image_base64": "<base64 bytes>",
  "expected_sign": "C"
}
```

and expects:

```json
{
  "predicted_sign": "C",
  "confidence": 0.93,
  "success": true,
  "error": null
}
```

### Current status

- The `asl_rec` adapter is implemented and wired through the factory.
- Production targets `http://172.20.70.2:5000/predict` on the on-prem NixOS host.
- End-to-end path is verified: `POST /api/v1/signs/recognize` reaches the container and returns a response.
- Model accuracy is still being tuned (misclassifications at low confidence have been observed during testing).

Use `RECOGNIZER_IMPL=stub` for local development without the on-prem service.

## Production

The active backend runs as a systemd service (`asl-backend.service`) on `salva-backend` (`172.20.70.140`), serving Uvicorn on port 8000. Frontend nodes proxy `/api/` to this host.

Runtime layout:

- Repo checkout: `/opt/asl`
- Backend app: `/opt/asl/backend`
- Virtualenv: `/opt/asl/backend/.venv-prod`
- Env file: `/etc/asl-backend.env`
- Service user: `debian`

Example `/etc/asl-backend.env` keys (no secret values shown):

```env
DATABASE_URL=postgresql+asyncpg://asl:***@172.20.70.144:5432/asl
JWT_SECRET=***
CORS_ORIGINS=https://10.49.12.41
RECOGNIZER_IMPL=asl_rec
ASL_REC_URL=http://172.20.70.2:5000/predict
ASL_REC_TIMEOUT_SECONDS=10
```

Deploy an update (see also [root README](../README.md#production-deployment)):

```bash
# On 172.20.70.140
cd /opt/asl
git fetch origin
git reset --hard origin/main

cd /opt/asl/backend
.venv-prod/bin/pip install .
.venv-prod/bin/alembic upgrade head
.venv-prod/bin/python -m scripts.seed_curriculum
sudo systemctl restart asl-backend
```

Verify:

```bash
systemctl status --no-pager --lines=8 asl-backend.service
curl -sS http://127.0.0.1:8000/health
curl -sS http://127.0.0.1:8000/api/v1/billing/plans
```

If the service fails immediately after restart:

```bash
journalctl -u asl-backend.service -n 50 --no-pager
```

The backend requires the `stripe` Python package at runtime because `app.presentation.api.v1.billing` imports it on startup.
