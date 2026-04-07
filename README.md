# CarSensor Test Task (Next.js + PostgreSQL + Playwright)

Single-repo implementation of:
- hourly scraping from [carsensor.net](https://carsensor.net/)
- Japanese field translation/normalization dictionary
- PostgreSQL persistence
- JWT auth (`admin / admin123`)
- backend endpoints
- responsive web UI: cars list + details page

## Delivery Links
- Source code: `<put-your-github-or-gitlab-link-here>`
- Deployed app: `<put-your-public-app-link-here>`

## Stack
- `Next.js` (App Router, route handlers)
- `Prisma` + `PostgreSQL`
- `Playwright` (scraper worker)
- `jsonwebtoken` + `bcryptjs`
- `Tailwind CSS v4`

## API
- `POST /api/auth/login` - JWT login
- `POST /api/auth/logout` - logout (clear cookie)
- `GET /api/auth/me` - current user
- `GET /api/cars` - list with filters/sort/pagination
- `GET /api/cars/:id` - car details
- `GET|POST /api/cron/scrape` - trigger scraping job

### `/api/cars` query params
- `page`, `limit`
- `q`, `brand`, `model`
- `yearFrom`, `yearTo`
- `priceFrom`, `priceTo`
- `mileageFrom`, `mileageTo`
- `sort`: `newest | price_asc | price_desc | year_desc | year_asc | mileage_asc | mileage_desc`

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create env:
```bash
cp .env.example .env
```
3. Configure `DATABASE_URL` in `.env`.
4. Generate Prisma client:
```bash
npm run prisma:generate
```
5. Create DB schema:
```bash
npm run db:push
```
6. Seed admin user:
```bash
npm run db:seed-admin
```

## Run
Start app:
```bash
npm run dev
```
Open `http://localhost:3000`, login with:
- username: `admin`
- password: `admin123`

## Scraping
One-time scrape:
```bash
npm run scrape:once
```

Hourly local worker:
```bash
npm run scrape:hourly
```

Backfill existing DB records to Russian:
```bash
npm run backfill:ru
```

Optional env for worker:
- `SCRAPE_MAX_PAGES` (default `1`)
- `SCRAPE_MAX_CARS` (default `25`)
- `SCRAPE_CRON` (default `0 * * * *`)

Optional env for backfill:
- `BACKFILL_SOURCE_IDS=AU123,AU456` (target specific cars)
- `BACKFILL_LIMIT=20` (limit records)
- `BACKFILL_WITH_SPECS=1` (also backfill `rawSpecs.translated`)

## Hourly in Deploy
- `vercel.json` contains hourly cron: `0 * * * *`
- endpoint: `/api/cron/scrape`
- authorization:
  - Vercel Cron header `x-vercel-cron` (auto)
  - or `x-cron-secret` / `?secret=` for external scheduler

## Production Env Checklist
Required for deploy:
- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Optional:
- `OPENAI_API_KEY`
- `OPENAI_TRANSLATE_MODEL`

Check env:
```bash
npm run check:env
```
Strict production validation (fails on invalid/missing required secrets):
```bash
npm run check:env:prod
```

## Smoke Tests
Run app first (`npm run dev` or deployed URL), then:
```bash
npm run test:smoke
```

Optional:
- `SMOKE_BASE_URL` (default `http://localhost:3000`)

Smoke test validates:
- unauthorized access is blocked
- login works and returns JWT/cookie
- authenticated `/api/auth/me` works
- cars list endpoint works with pagination metadata
- car details endpoint works
- logout endpoint responds correctly

## Architecture + Trade-offs
- **App Router + Route Handlers** instead of separate backend service:
  faster delivery and fewer moving parts; trade-off is tighter coupling between UI and API.
- **Prisma over raw SQL**:
  safer schema evolution and faster querying implementation; trade-off is less SQL-level control for edge-case optimizations.
- **Playwright for scraping**:
  robust against dynamic DOM and JS rendering; trade-off is heavier runtime vs pure HTTP parser.
- **Dictionary + AI translation fallback**:
  deterministic normalization for key fields plus better coverage on long free text; trade-off is external dependency/latency for deep translation quality.
- **Cron endpoint + local cron worker**:
  supports both cloud scheduler and local development; trade-off is duplicate orchestration paths to maintain.

## Notes about normalization
The scraper extracts Japanese keys/values from spec tables and applies:
- key dictionary (`SPEC_KEY_DICTIONARY`)
- value translation dictionary (`VALUE_DICTIONARY`)

Files:
- `src/lib/scraper/dictionary.ts`
- `src/lib/scraper/normalize.ts`

Raw + translated specs are stored in `Car.rawSpecs` JSON.

## Translation fallback
- Primary translator: OpenAI (`OPENAI_API_KEY`)
- Automatic fallback (no key / quota issues): public Google translate endpoint
- Last fallback: internal dictionary replacement
