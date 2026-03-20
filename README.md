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
2. Set `DATABASE_URL`, `SESSION_SECRET`, and optionally `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
3. Install dependencies with `npm install`.
4. Run `npx prisma db push`.
5. Run `npm run dev`.

## Deploying on Vercel

- Use a free PostgreSQL provider like Neon or Supabase for `DATABASE_URL`.
- Add the same environment variables in Vercel.
- Run the build command: `npm run build`.

## Notes

- The admin account is hardcoded through environment variables and is not editable in the UI.
- Part stats live in [`lib/beyblade-data.js`](/Users/nugroho/Beyblade/BeyApp/lib/beyblade-data.js) and are seeded from a curated BeyBrew-based dataset so you can expand or tune values over time.
