# MongoDB backend (future)

Implement the repository protocols in `app/domain/ports/` and register in `app/infrastructure/db/factory.py` when `DB_BACKEND=mongo`.

Suggested collections: `users` (embed profile + progress), `units` (embed lessons + exercises).
