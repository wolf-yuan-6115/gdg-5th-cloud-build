# Project notes

- Educational Cloud Build → Artifact Registry → Cloud Run demo, not a real ordering service.
- Use Bun for installation, development, builds, tests, and production execution.
- HeroUI v3 built-in dark theme only. Traditional Chinese UI and README.
- Store engineering notes here; README contains usage instructions only.
- Root config.json is the sole menu source and is shipped inside the image.
- No auth, database, payment, persistent cart, or actual order submission.
- Default all Google Cloud regions to us-central1. Never deploy or push images during development.
- Commit incremental work using conventional commit subjects without bodies.
- Run bun run check, bun run build, and local container smoke tests.
- User-approved visual direction: task-oriented menu and cart, desktop two columns, mobile stacked; no custom theme or external imagery.
