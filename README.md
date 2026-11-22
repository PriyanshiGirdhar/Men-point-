# Clothify

A Myntra-style clothing ecommerce platform (Men / Women / Kids), split into:

- `apps/backend` — NestJS + Prisma + PostgreSQL REST API, image storage on Cloudflare R2
- `apps/web` — Next.js (App Router) storefront + `/admin` admin panel

The two apps talk over the REST contract documented in [`API_CONTRACT.md`](./API_CONTRACT.md).
The Prisma schema at `apps/backend/prisma/schema.prisma` is the source of truth for the data model.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) — or your own Postgres instance
- A Cloudflare R2 bucket (account id, access key id/secret, bucket name, and a public URL/custom domain for the bucket)

## 1. Install dependencies

```bash
npm install
```

(This installs both `apps/backend` and `apps/web` via npm workspaces.)

## 2. Start Postgres

```bash
npm run db:up
```

This starts a local Postgres container (user/pass/db: `clothify`/`clothify`/`clothify`, port 5432) via `docker-compose.yml`.
Point `apps/backend/.env`'s `DATABASE_URL` at your own instance instead if you'd rather not use Docker.

## 3. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/backend/.env` with your Cloudflare R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`, `R2_PUBLIC_URL`) and JWT secrets. The default `DATABASE_URL` matches the Docker Postgres above.

## 4. Run database migrations + seed data

```bash
npm run prisma:migrate
npm run prisma:seed
```

Seeding creates the category tree (Men/Women/Kids + subcategories), ~12 sample products with variants, and an admin
account — see `apps/backend/README.md` for the seeded admin login.

## 5. Run both apps

```bash
npm run dev:backend   # http://localhost:4000/api
npm run dev:web       # http://localhost:3000
```

Sign up as a normal customer to see the onboarding → storefront → cart → checkout flow, or log in with the seeded
admin account and visit `/admin` for the admin panel (products, orders, users, dashboard stats).

## Notes on payments

Checkout supports **Cash on Delivery** (fully functional) and a **Card** option that is accepted and marked `PAID`
immediately — no live payment gateway is wired in yet. Swapping in a real gateway (Razorpay/Stripe) only touches
the `orders` module on the backend and the payment step of `/checkout` on the frontend.
