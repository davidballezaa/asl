# ASL Academy — Frontend

Expo React Native app for learning ASL through gamified lessons and camera practice. Ships as a static web export in production.

## Tech stack

- **Expo 54** with **Expo Router** for file-based navigation
- **React Native 19** / **React 19** with TypeScript
- **`expo-camera`** for live sign practice
- Static web export (`expo export --platform web`) served by NGINX in production

## App structure

| Path | Purpose |
| --- | --- |
| `app/` | Expo Router screens: `login`, `register`, `home`, `learn`, `lesson/[lessonId]`, `challenges`, `profile`, `admin` |
| `components/` | UI primitives (`NBButton`, `NBCard`), lesson flow, profile widgets, admin charts |
| `lib/api/` | Typed HTTP client (`auth`, `lessons`, `signs`, `billing`, `challenges`, `admin`, etc.) |
| `lib/` | Progression, i18n, subscription helpers, alphabet data |

## Key user flows

1. **Auth** — Register or log in; JWT stored client-side for API calls.
2. **Learn path** — Browse units and lessons; track completion and XP on the home and learn screens.
3. **Lesson** — Multiple-choice quizzes and camera practice exercises; frames sent to `POST /api/v1/signs/recognize`.
4. **Profile and challenges** — View streaks, practice heatmap, level progress; claim weekly challenges.
5. **Admin** — Metrics overview and curriculum browser (admin users only).

## Getting started

Start the [backend](../backend/README.md) first, then:

```bash
cp .env.example .env
pnpm install
pnpm start
```

### Environment

Set `EXPO_PUBLIC_API_URL` in `.env`:

| Target | Value |
| --- | --- |
| Simulator / local web | `http://localhost:8000/api/v1` |
| Physical device on LAN | `http://<your-lan-ip>:8000/api/v1` |
| Production build | `/api/v1` (same-origin through the frontend NGINX proxy) |

Use your LAN IP instead of `localhost` when testing on a physical device.

## Production architecture

The frontend is **not** a long-running Node process in production. The deployment flow builds static assets and serves them with NGINX:

1. `expo export --platform web` writes files to `dist/`
2. NGINX serves `/var/www/asl` with SPA fallback: `try_files $uri $uri/ /index.html`
3. `location /api/` proxies to the backend at `http://172.20.70.140:8000`
4. `location = /healthz` returns `200 ok` for load balancer health checks

Setting `EXPO_PUBLIC_API_URL=/api/v1` at build time makes the browser call the API on the same origin; NGINX forwards those requests to the backend.

See the [root README](../README.md) for instance inventory, deploy order, and load balancer details.

## Production deployment

Runtime layout per frontend node (`salva-frontend-1`, `salva-frontend-2`):

- Repo checkout: `/opt/asl`
- Frontend app: `/opt/asl/frontend`
- Build output: `/opt/asl/frontend/dist`
- Web root: `/var/www/asl`
- Service: `nginx`

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

`rsync` is not installed on the frontend hosts; use `sudo cp -a` unless you install `rsync` first.

Verify:

```bash
curl -I http://127.0.0.1/healthz
curl -I http://127.0.0.1/
curl -sS http://127.0.0.1/api/v1/billing/plans
```

## Credits

Third-party visual assets and licenses are listed in [Credits.md](Credits.md).
