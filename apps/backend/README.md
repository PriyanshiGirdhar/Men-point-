# Clothify Backend

NestJS 10 + Prisma 5 REST API implementing `API_CONTRACT.md` at the repo root.

## Running locally

From the **repo root** (`clothify/`):

```bash
npm install
npm run db:up                 # starts Postgres via docker compose
cp apps/backend/.env.example apps/backend/.env
npx prisma migrate dev --schema apps/backend/prisma/schema.prisma
npx prisma db seed --schema apps/backend/prisma/schema.prisma
npm run dev:backend
```

Or from `apps/backend` directly:

```bash
npm install
docker compose -f ../../docker-compose.yml up -d postgres
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

The API listens on `http://localhost:4000/api` (CORS allows `http://localhost:3000` with credentials).

## Seeded admin login

- Email: `admin@clothify.com`
- Password: `Admin@123`

The seed also creates the Men/Women/Kids category tree and ~12 sample products with variants and images.

## Scripts

- `npm run start:dev` – start in watch mode
- `npm run build` / `npm run start:prod` – production build + run
- `npm run prisma:generate` – regenerate the Prisma client
- `npm run prisma:migrate` – run `prisma migrate dev`
- `npm run prisma:seed` – run `prisma db seed`
