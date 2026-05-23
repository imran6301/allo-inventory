# Allo Inventory — Take-Home Exercise

Live URL:https://allo-inventory-seven.vercel.app/

## Running Locally

### Prerequisites
- Node.js 18+
- A Supabase (or Neon/Railway) Postgres instance

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/allo-inventory.git
cd allo-inventory
npm install
```

Copy `.env.example` to `.env` and fill in your database URL:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

Run migrations and seed:
```bash
npx prisma migrate dev
npm run db:seed
```

Start dev server:
```bash
npm run dev
# Open http://localhost:3000
```

## How Expiry Works

I implemented lazy cleanup (also called cleanup-on-read):

- When `GET /api/products` is called, it first runs `updateMany` to mark any `pending` reservations past their `expiresAt` as `released`.
- The stock's `reserved` count is derived from active reservations — so once expired ones are marked released, available stock immediately reflects correctly.
- No background worker or cron job is needed. This means there's a small window where expired reservations still "appear" reserved until the next product listing request — acceptable for this use case.

Trade-off: In production, I'd add a Vercel Cron job (or pg_cron on Supabase) that runs every minute to clean up expired reservations proactively, especially for high-throughput scenarios.

## Concurrency Strategy

The `POST /api/reservations` endpoint uses **Postgres row-level locking (`SELECT ... FOR UPDATE` inside a transaction). This guarantees:

- Only one transaction can read/modify a given stock row at a time
- If two requests come in simultaneously for the last unit, one gets the lock first, decrements `reserved`, and commits. The second then acquires the lock, sees `available = 0`, and returns 409.
- No Redis required, no application-level locks — the database is the source of truth.

## Idempotency (Bonus)

The `POST /api/reservations` endpoint supports an optional `Idempotency-Key` header. If a request comes in with a key that matches an existing reservation, the original reservation is returned without creating a duplicate. This handles client retries safely (e.g. network timeouts causing a retry that would otherwise double-reserve stock).

## Trade-offs & What I'd Do With More Time

- Expiry: Add proactive cron cleanup (Vercel Cron or Supabase pg_cron)
- Auth: No authentication — in production, reservations would be tied to user sessions
- Quantity selection: UI currently reserves exactly 1 unit; would add a quantity picker
- Optimistic UI: Product listing re-fetches from server after reserve; could use React Query for smarter cache invalidation
- Tests: Would add integration tests for the concurrency logic specifically (simulate concurrent requests)
