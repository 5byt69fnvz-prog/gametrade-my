# GameTrade MY

Production-oriented Malaysia-first C2C game virtual goods marketplace. The application uses Next.js, TypeScript, PostgreSQL and Prisma with real server sessions, Email OTP, audit logs and an administrator operations console.

## Production features

- Account registration with a unique Email, optional Malaysian mobile number and password.
- Email OTP through Resend; a verified Email unlocks buying, selling and withdrawals.
- HttpOnly database-backed sessions, password hashing, request origin checks and rate limits.
- Game/region catalogue with original AI-generated 16:9 artwork.
- Moderated seller listings, stock reservation and idempotent order creation.
- Manual payment proof review, seller delivery, buyer acceptance and dispute handling.
- Server-calculated wallet ledger, withdrawal holds, approval and rejection release.
- Admin customer records, OTP delivery history, risk flags, bans and immutable audit logs.
- Chinese-first interface with English and Bahasa Malaysia navigation support.
- Game variants, price radar, seller trust passports, branded MY checkout and safe order rooms.

## Local setup

Requirements: Node.js 20+, npm and PostgreSQL 16+.

1. Copy `.env.example` to `.env` and replace every secret and provider value.
2. Create the PostgreSQL database from `DATABASE_URL`.
3. Install, migrate and seed:

```powershell
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:4173`. Normal seeding creates the game catalogue and the administrator configured by `INITIAL_ADMIN_*`.

For a local showcase with 16 listings, a safe-room order and three demo roles, run:

```powershell
$env:SEED_DEMO_DATA="true"
npm run db:seed
```

Demo accounts are only created outside production:

- Buyer: `demo-buyer@gametrade.my` / `DemoBuyer2026`
- Seller: `demo-seller@gametrade.my` / `DemoSeller2026`
- Admin: `demo-admin@gametrade.my` / `DemoAdmin2026`

## Deploy from GitHub to Render

The included `render.yaml` creates a Singapore web service and PostgreSQL database, runs migrations before deployment and starts the production Next.js server.

1. Push this repository to a private GitHub repository.
2. In Render, create a Blueprint and select the repository.
3. Enter all environment values marked `sync: false`, especially `APP_URL`, `INITIAL_ADMIN_*`, Resend and S3-compatible storage credentials.
4. Set `APP_URL` to the final HTTPS origin. After the first deployment, run the seed again if the initial administrator values were added later.
5. Attach a custom domain and update DNS in Render. Never publish `.env` or provider credentials to GitHub.
6. Call `POST /api/internal/maintenance` every 5-10 minutes with `Authorization: Bearer $CRON_SECRET` to expire unpaid orders, open overdue-delivery reviews and auto-complete delivered orders after 72 hours.

## Required production services

- PostgreSQL: Render PostgreSQL or another managed PostgreSQL 16+ provider.
- Email OTP: Resend API key and a verified sending domain.
- Payment proof files: private S3-compatible bucket such as Cloudflare R2 or AWS S3.
- Payments: current flow supports administrator-reviewed Malaysian bank/e-wallet transfers. Automated FPX/card settlement requires a licensed gateway integration and reconciliation work.

## Verification

```powershell
npm run typecheck
npm run build
```

Before public commercial launch, complete Malaysian legal, tax, PDPA, payment collection/escrow and prohibited-goods review. Source completeness does not replace those business approvals or third-party service accounts.
