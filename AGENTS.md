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

## Validation and implementation notes

- Pinned Next.js 16.4.6, React 19.3.1, HeroUI 3.2.7, Bun 1.4.4.
- TypeScript 5.9.3 is intentional: typescript-eslint currently rejects TS 7.
- Menu IDs reserve `random` for the static API route; prices are integer TWD (0–1,000,000).
- API routes are dynamic with no-store responses and use a shared filesystem reader; config errors are logged only on the server.
- Runtime executes standalone server.js with Bun as a non-root user. Explicitly copy config.json and static assets.
- `public/.gitkeep` ensures fresh clones have the directory required by Docker COPY.
- Local lint/typecheck and six Bun tests passed. Four Chromium desktop/mobile E2E cases passed against the production Docker image.
- Production build and Docker build passed; API/assets smoke tests passed on container ports 8080 and 9090.
- Desktop/mobile screenshots inspected: built-in dark theme, no horizontal overflow. UI detector returned no findings.
- Cloud Build YAML parsed and step order/default region checked; cloud IAM and deployment remain unverified by design.
- A sandbox-restricted Turbopack run can poison .next cache. Clear only .next and rerun with local process permissions if its port-binding error persists.
- Host port 8080 was occupied; verification used 18080 and 19090 without touching the existing service.
- Rebuilt an isolated copy with the first item renamed; its container API served the updated name and passed smoke tests. Original menu retained.
- All task-created test containers stopped after validation; local images retained. No Google Cloud API mutations or deployments performed.
- Cloud Build's check step now starts with `bun run validate:menu`, explicitly validating root config.json before lint/typecheck/tests. Invalid data exits 1 with a useful item ID and price error.
- Eight Bun tests pass, including accepted price boundaries and a negative-price diagnostic. Isolated CLI checks confirmed negative prices and malformed JSON exit 1 without modifying the real menu.
