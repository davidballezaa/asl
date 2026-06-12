# ASL Academy — Frontend

Expo React Native app for learning ASL through gamified lessons and camera practice.

## Getting started

Start the [backend](../backend/README.md) first, then:

```bash
cp .env.example .env
pnpm install
pnpm start
```

Set `EXPO_PUBLIC_API_URL` in `.env`:
- Simulator: `http://localhost:8000/api/v1`
- Physical device: `http://<your-lan-ip>:8000/api/v1`

## Production

The frontend is deployed as a static Expo web export served by NGINX.

Runtime layout per frontend node:

- Repo checkout: `/opt/asl`
- Frontend app: `/opt/asl/frontend`
- Build output: `/opt/asl/frontend/dist`
- Web root: `/var/www/asl`
- Service: `nginx`
- API base URL at build time: `/api/v1`

Deploy one node at a time:

```bash
cd /opt/asl
git fetch origin
git reset --hard origin/main

cd /opt/asl/frontend
pnpm install --frozen-lockfile
EXPO_PUBLIC_API_URL=/api/v1 pnpm exec expo export --platform web
sudo mkdir -p /var/www/asl
sudo cp -a dist/. /var/www/asl/
sudo systemctl reload nginx
```

Verify:

```bash
curl -I http://127.0.0.1/healthz
curl -I http://127.0.0.1/
curl -sS http://127.0.0.1/api/v1/billing/plans
```

`rsync` is not installed on the current frontend nodes, so use `cp -a` unless you install `rsync` first.
