# ASL Learning App

Gamified American Sign Language fingerspelling app with camera-based sign practice.

| Directory               | Description           |
| ----------------------- | --------------------- |
| [`frontend`](frontend/) | Expo React Native app |
| [`backend`](backend/)   | FastAPI API           |

See the README in each directory to run locally.

## Production deployment

Production hosts keep a checkout of this repo at `/opt/asl`. Do not reclone for normal deploys; update the existing checkout in place.

### Instance inventory

- Frontend 1: `debian@172.20.70.165`
- Frontend 2: `debian@172.20.70.166`
- Active backend: `debian@172.20.70.140`
- SSH key: `equipo-salva`

SSH pattern:

```bash
ssh -i equipo-salva debian@172.20.70.140
```

### Backend rollout (`172.20.70.140`)

The backend runs from:

- Repo checkout: `/opt/asl`
- App directory: `/opt/asl/backend`
- Virtualenv: `/opt/asl/backend/.venv-prod`
- Service: `asl-backend.service`
- Env file: `/etc/asl-backend.env`

Deploy:

```bash
ssh -i /Users/dave/Downloads/equipo-salva debian@172.20.70.140 '
  set -e
  cd /opt/asl
  git fetch origin
  git reset --hard origin/main
  cd /opt/asl/backend
  .venv-prod/bin/pip install .
  .venv-prod/bin/alembic upgrade head
  .venv-prod/bin/python -m scripts.seed_curriculum
  sudo systemctl restart asl-backend
'
```

Verify:

```bash
ssh -i equipo-salva debian@172.20.70.140 '
  systemctl status --no-pager --lines=8 asl-backend.service
  curl -sS http://127.0.0.1:8000/health
  curl -sS http://127.0.0.1:8000/api/v1/billing/plans
'
```

### Frontend rollout (`172.20.70.165`, `172.20.70.166`)

Each frontend node serves a static Expo web export through NGINX.

- Repo checkout: `/opt/asl`
- App directory: `/opt/asl/frontend`
- Build output: `/opt/asl/frontend/dist`
- Web root: `/var/www/asl`
- Service: `nginx`
- API proxy target: `http://172.20.70.140:8000`

Deploy one node at a time:

```bash
ssh -i equipo-salva debian@172.20.70.166 '
  set -e
  cd /opt/asl
  git fetch origin
  git reset --hard origin/main
  cd /opt/asl/frontend
  pnpm install --frozen-lockfile
  EXPO_PUBLIC_API_URL=/api/v1 pnpm exec expo export --platform web
  sudo mkdir -p /var/www/asl
  sudo cp -a dist/. /var/www/asl/
  sudo systemctl reload nginx
'
```

`rsync` is not installed on the current frontend hosts, so publish with `cp -a` unless you install `rsync` first.

Verify:

```bash
ssh -i equipo-salva debian@172.20.70.166 '
  curl -I http://127.0.0.1/healthz
  curl -I http://127.0.0.1/
  curl -sS http://127.0.0.1/api/v1/billing/plans
'
```

### Notes

- Roll backend first, then frontends.
- As of `2026-06-12`, `172.20.70.165` timed out on SSH while `172.20.70.166` and `172.20.70.140` were reachable.
- If one frontend node is stale or unreachable, temporarily drain it on `salva-lb` (`172.20.70.149`) by editing the `upstream asl_frontends` block in `/etc/nginx/sites-enabled/*`, testing with `sudo nginx -t`, and reloading NGINX.
- If a host checkout is dirty, inspect `git status` before resetting it. The deploy checkouts are expected to track `origin/main`.
