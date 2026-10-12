# Marketplace Backend

A multi-vendor e-commerce marketplace backend, built from scratch to rebuild core backend fundamentals (databases, authentication, transactions) before extending into microservices and Elasticsearch. Buyers browse and purchase products; sellers list and manage their own inventory; orders are processed with real concurrency safety against overselling.

## Why this project

This was built deliberately with raw SQL and hand-written logic (no ORM, no auth library doing the heavy lifting) to solidify fundamentals that get abstracted away too easily — transactions, row-level locking, token rotation, ownership-based authorization — before moving on to Prisma, microservices, and Elasticsearch in later phases.

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** PostgreSQL (raw SQL, hand-written migrations)
- **Auth:** JWT access tokens + rotating, hashed refresh tokens
- **Password hashing:** argon2id

## Features

### Authentication
- Signup / login with argon2id password hashing
- JWT access tokens (15 min) + refresh tokens (7 days, rotated on every use)
- Refresh tokens are stored **hashed**, never in plaintext — a DB leak alone can't be used to impersonate users
- Token rotation: reusing an already-rotated refresh token is rejected, closing the window for silent token-theft replay
- Logout revokes the refresh token server-side
- Role-based access control (`buyer` / `seller`) via middleware, applied per-route

### Products
- Public browsing (list with pagination, single product fetch) — no auth required
- Seller-only create/update/delete, gated by both **role** (`requireRole("seller")`) and **ownership** (a seller can only modify their own listings, enforced independently of the role check)
- Soft deletes throughout — no user, product, or listing is ever hard-deleted
- Partial updates via `COALESCE`, so a seller can update just one field without resending the whole product

### Orders
- Atomic order placement using a real Postgres transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) with `SELECT ... FOR UPDATE` row-level locking
- **Verified under genuine concurrent load:** two simultaneous buyers competing for the last unit of stock — exactly one order succeeds, the other is correctly rejected with no overselling and no partial state left behind on rollback
- Order items snapshot product name and price at the moment of purchase, so historical orders stay accurate even if a product's price or name changes later
- Cart items are merged by product before processing (duplicate entries don't double-lock the same row)
- Sellers can update order status (`pending → paid → shipped → delivered`/`cancelled`), scoped to orders containing at least one of their own products (an order can span multiple sellers)
- Buyers can view their own order history and individual orders; ownership-enforced

## Database Design Principles

- UUID primary keys everywhere (prevents ID enumeration on public endpoints)
- Money stored as integer cents, never floats
- `created_at` / `updated_at` on every table
- Soft deletes (`deleted_at`) instead of hard deletes on user-facing data
- `CHECK` constraints enforce valid states at the database level (roles, order statuses, non-negative prices/stock) — never trusted to the application layer alone

## Project Structure

```
src/
├── config/          # DB connection
├── db/queries/       # raw SQL, one file per domain
├── middleware/        # requireAuth, requireRole
├── modules/
│   ├── auth/          # routes → controller → service
│   ├── products/
│   └── orders/
├── utils/              # hashing, JWT, token generation
└── server.js
migrations/            # numbered, sequential, never edited after being applied
```

Each module follows the same layering: **routes** (HTTP wiring only) → **controller** (request/response handling) → **service** (business logic, ownership checks) → **queries** (raw SQL). This separation is intentional — it's the same boundary that makes the planned microservices split (Phase 2) straightforward, since each module maps cleanly to a future standalone service.

## Known Simplifications

Documented here deliberately rather than hidden — these are conscious scope decisions, not oversights:

- Order status updates are checked per-item against the requesting seller, since one order can contain products from multiple sellers; a production system would likely split a multi-seller order into separate per-seller sub-orders
- No payment processor integration — `status` transitions are manual for now
- No rate limiting on general endpoints yet (present on auth endpoints specifically)
- Revoked refresh tokens are kept, not deleted, to support future theft-detection logic (not yet built) — a periodic cleanup job for long-expired rows is a planned addition, not yet implemented

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET
bash scripts/migrate.sh
npm run dev
```

## What's Next (Phase 2+)

- Migrate from raw SQL to Prisma
- Split into independently deployable services (auth, catalog, orders, search) communicating via REST + RabbitMQ events
- Elasticsearch-backed product search with filtering, facets, and autocomplete
- API Gateway, Dockerized full stack, deployment