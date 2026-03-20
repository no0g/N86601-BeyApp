# N86601 BeyApp

Next.js Beyblade X tracker with:

- hardcoded admin bootstrap login
- admin-only user creation
- user password changes
- combo builder with BeyBrew-based seeded part stats
- 3-combo deck builder with no repeated components
- tournament and match tracking
- admin aggregate reporting

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SESSION_SECRET`, and optionally `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
3. Install dependencies with `npm install`.
4. Run `npx prisma db push`.
5. Run `npm run dev`.

## Deploying on Vercel

- Use a free PostgreSQL provider like Neon or Supabase.
- For Prisma Accelerate on Vercel:
  - `DATABASE_URL` should be your `prisma://...` Accelerate URL
  - `DIRECT_DATABASE_URL` should be your direct `postgresql://...` URL
- Add the same environment variables in Vercel.
- Run the build command: `npm run build`.

## Connection Pooling

Vercel serverless functions can open too many direct PostgreSQL connections if Prisma talks to the database without pooling. This app is configured to use Prisma Accelerate via `withAccelerate()` in [`lib/prisma.js`](/Users/nugroho/Beyblade/BeyApp/lib/prisma.js), which is the recommended fix for Prisma on Vercel.

Relevant docs:

- [Deploy to Vercel](https://docs.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Prisma Accelerate](https://www.prisma.io/docs/accelerate/getting-started)

Recommended production env vars:

- `DATABASE_URL`: Prisma Accelerate `prisma://...`
- `DIRECT_DATABASE_URL`: direct Postgres `postgresql://...`
- `SESSION_SECRET`: strong random string
- `ADMIN_USERNAME`: admin username
- `ADMIN_PASSWORD`: strong admin password

## Notes

- The admin account is hardcoded through environment variables and is not editable in the UI.
- Part stats live in [`lib/beyblade-data.js`](/Users/nugroho/Beyblade/BeyApp/lib/beyblade-data.js) and are seeded from a curated BeyBrew-based dataset so you can expand or tune values over time.
