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
