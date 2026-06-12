# ASL Learning API

FastAPI backend for the ASL Quest mobile app.

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

SQLite (no Postgres needed): omit `.env` or set `DATABASE_URL=sqlite+aiosqlite:///./asl.db`.

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
| `JWT_SECRET` | Auth token signing key |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `RECOGNIZER_IMPL` | `stub` or `asl_rec` |
| `ASL_REC_URL` | Upstream recognizer endpoint, default `http://172.20.70.2:5000/predict` |
| `ASL_REC_TIMEOUT_SECONDS` | HTTP timeout for upstream recognition requests |

## Production

The active backend currently runs as a systemd service (`asl-backend.service`) on `salva-backend-2` (`172.20.70.140`), serving uvicorn directly on port `8000`. The frontend nodes proxy `/api/` to this host.

Runtime layout:

- Repo checkout: `/opt/asl`
- Backend app: `/opt/asl/backend`
- Virtualenv: `/opt/asl/backend/.venv-prod`
- Env file: `/etc/asl-backend.env`
- Service user: `debian`

To deploy an update:

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

Verify after deploy:

```bash
systemctl status --no-pager --lines=8 asl-backend.service
curl -sS http://127.0.0.1:8000/health
curl -sS http://127.0.0.1:8000/api/v1/billing/plans
```

Environment is loaded from `/etc/asl-backend.env`.

If the service fails immediately after restart, check:

```bash
journalctl -u asl-backend.service -n 50 --no-pager
```

The backend now requires the `stripe` Python package at runtime because `app.presentation.api.v1.billing` imports it on startup.

## Tests

```bash
pytest
```

## Sign recognition

The backend now supports an HTTP-backed recognizer adapter. Production should use:

```env
RECOGNIZER_IMPL=asl_rec
ASL_REC_URL=http://172.20.70.2:5000/predict
ASL_REC_TIMEOUT_SECONDS=10
```

The backend sends:

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
