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

The backend runs as a systemd service (`asl-backend.service`) on the `salva-backend` instance, serving uvicorn directly on port `8000`. NGINX on `salva-lb` handles TLS termination and proxying.

To deploy an update:

```bash
# On salva-backend
cd /opt/asl/backend
git pull
.venv-prod/bin/pip install .
.venv-prod/bin/alembic upgrade head
python -m scripts.seed_curriculum
sudo systemctl restart asl-backend
```

Environment is loaded from `/etc/asl-backend.env`.

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
