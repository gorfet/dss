# Deployment guide

## 1. Local with Docker Compose (recommended for demo)

```bash
git clone <repo>
cd dss
cp .env.example .env
# Set NEXTAUTH_SECRET in .env
docker compose up -d --build
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

App → http://localhost:3000

To tear down: `docker compose down -v`

---

## 2. Bare metal (Node + PostgreSQL)

### Requirements
- Node.js 20+
- PostgreSQL 14+
- A persistent volume for the DB

### Steps

```bash
git clone <repo>
cd dss
cp .env.example .env

# Fill .env
# DATABASE_URL=postgresql://USER:PASS@HOST:5432/dss_enrollment?schema=public
# NEXTAUTH_URL=https://your-host.example.com
# NEXTAUTH_SECRET=<openssl rand -base64 32>

npm ci
npm run db:push
npm run db:seed   # optional
npm run build
npm run start     # or run behind PM2 / systemd
```

For production behind a reverse proxy (Nginx, Caddy):
- Forward TLS-terminated traffic from `:443` → `http://127.0.0.1:3000`
- Set `NEXTAUTH_URL=https://your-host.example.com` (must match exactly)

---

## 3. Vercel

1. Push the repo to GitHub/GitLab.
2. Provision a Postgres instance (Neon, Supabase, RDS, Vercel Postgres).
3. In Vercel project settings, add env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
4. Add the **Prisma** build override (already wired): `npm run build` runs `prisma generate` first via the package script.
5. Run `npx prisma db push` once against the production DB (locally or via CI step).
6. (Optional) Run `npm run db:seed` against the prod DB only for demos.

> Vercel uses serverless functions for API routes. The Prisma client is reused via the singleton in `src/lib/prisma.ts`.

---

## 4. Database migrations

The schema is push-based by default (`npm run db:push`) — fine for early-stage or single-tenant setups.

For audit-friendly versioned migrations:

```bash
npm run db:migrate -- --name init
```

This creates SQL migration files under `prisma/migrations/` that should be checked in.

---

## 5. Email & notifications

Email is **stubbed**: `sendEmail` logs to the console when `EMAIL_SERVER` is not configured.

To enable real email, edit `src/lib/notifications.ts` and plug in your preferred provider:
- **SMTP**: use `nodemailer.createTransport(process.env.EMAIL_SERVER)`
- **Resend / SES / Postmark**: replace the body of `sendEmail` with the provider SDK call

In-app notifications work out of the box and are polled every 15s from the dashboard shell.

---

## 6. Hardening checklist

- Rotate `NEXTAUTH_SECRET` for production. Never commit it.
- Set `NEXTAUTH_URL` to the canonical HTTPS URL.
- Restrict database access (no public ingress).
- Enable connection pooling in production (PgBouncer, Neon pooler, etc.) and use the `?pgbouncer=true&connection_limit=1` query string in `DATABASE_URL` if needed.
- Configure log shipping for `console.log` events (notifications + audit are logged) — they're plain JSON for easy ingestion.
- Add reverse-proxy rate limits on `/api/auth/*`.

---

## 7. Common operational tasks

```bash
# Reset DB (destructive!)
npm run db:reset

# Inspect schema
npx prisma studio       # opens https://localhost:5555

# Force regenerate Prisma client (after schema change)
npx prisma generate
```
