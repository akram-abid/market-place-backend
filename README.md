# Marketplace Backend

A multi-vendor e-commerce marketplace backend built as a set of microservices: buyers browse, search and purchase; sellers manage their own listings; orders are processed with proven concurrency safety against overselling. Everything runs with a single `docker compose up`.

## Why this project

Built deliberately by hand, starting with raw SQL and no ORM or auth library, to rebuild backend fundamentals (transactions, row-level locking, token rotation, ownership-based authorization) and then to learn microservices, event-driven messaging and Elasticsearch from scratch. The git history shows the full path: a Postgres monolith first, then the split into services.

## Architecture

```
                          Client
                            |
                      API Gateway :3000
        ______________|______|______|______________
       |              |             |              |
  auth-service   catalog-service  order-service  search-service
     :3001           :3002           :3003           :3004
       |              |    |          |               |
       |              |    |  HTTP    |               |
       |              |    '<---------'  (reserve      |
       |              |       stock)                   |
       |              |                                |
       |              '--- product events ----> RabbitMQ ---> consumer
       |                                                        |
   PostgreSQL (users, products, orders tables)           Elasticsearch
```

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Single public entry point; proxies by path to the services below |
| auth-service | 3001 | Signup, login, JWT access tokens, rotating refresh tokens, logout |
| catalog-service | 3002 | Product CRUD, stock reservation, publishes product events |
| order-service | 3003 | Order placement, order history, seller-managed order status |
| search-service | 3004 | Consumes product events, maintains the Elasticsearch index, serves search |

Infrastructure: PostgreSQL 17, RabbitMQ 3 (management UI on :15672), Elasticsearch 8.15.

### How the services talk to each other

- **Synchronous HTTP:** order-service calls catalog-service's `POST /products/reserve-stock` when an order is placed. Catalog-service owns the `products` table, so it performs the row-locked stock check and decrement inside its own transaction and returns the reserved items (name, price, quantity). Order-service then records the order locally from that data.
- **Asynchronous events:** catalog-service publishes `product.created`, `product.updated` and `product.deleted` to a RabbitMQ queue. Search-service consumes them and keeps the Elasticsearch index in sync. Catalog-service never calls search-service and doesn't know it exists; a publish failure is logged and never fails the product write.
- **Stateless auth:** every service verifies JWTs locally with a shared secret. No service calls auth-service to validate a token.

## Features

### Authentication
- argon2id password hashing
- Short-lived JWT access tokens (15 min) plus 7-day refresh tokens
- Refresh tokens are stored **hashed**, never in plaintext
- Rotation on every use: a reused (already rotated) refresh token is rejected
- Logout revokes the refresh token server-side
- Role-based access control (`buyer` / `seller`) via middleware

### Products and search
- Public browsing with pagination
- Seller-only writes, protected by both role and per-product ownership
- Soft deletes and partial updates (`COALESCE`)
- Full-text relevance search on product name, combined with category and price-range filters through an Elasticsearch `bool` query

### Orders
- Atomic order placement: `BEGIN` / `COMMIT` / `ROLLBACK` with `SELECT ... FOR UPDATE` row locking
- **Verified under real concurrent load:** two simultaneous buyers racing for the last unit of stock produced exactly one success and one clean `409`, with no overselling and no partial state after rollback
- Order items snapshot product name and price at purchase time, so history stays accurate if a product changes later
- Duplicate cart entries are merged before processing
- Buyers see only their own orders; sellers can update status on orders containing their products

## API (all through the gateway on :3000)

| Method | Path | Access |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout` | public |
| GET | `/products`, `/products/:id` | public |
| GET | `/products/search?q=&categoryId=&minPrice=&maxPrice=&limit=&offset=` | public |
| POST | `/products` | seller |
| PATCH / DELETE | `/products/:id` | seller, owner of the product |
| POST | `/orders` | authenticated |
| GET | `/orders`, `/orders/:id` | authenticated, own orders only |
| PATCH | `/orders/:id` | seller with an item in the order |

## Running it

Prerequisites: Docker with Compose.

```bash
# 1. create a .env file in the repo root
echo "JWT_SECRET=change-me-to-a-long-random-string" > .env

# 2. build and start everything
docker compose up --build
```

On first boot Postgres applies the SQL files in `migrations/` automatically. Elasticsearch is the slowest to become healthy, so the search service starts last. Then:

```bash
curl -X POST localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"password123"}'
```

New accounts are buyers. To try seller features, promote one directly:

```bash
docker compose exec postgres psql -U marketplace -d marketplace_dev \
  -c "UPDATE users SET role = 'seller' WHERE email = 'you@example.com';"
```

then log in again (the role is baked into the token at login).

To wipe all data and start clean: `docker compose down -v`.

## Repository layout

```
api-gateway/        reverse proxy, one route per service
auth-service/       routes -> controller -> service -> queries
catalog-service/    same layering, plus RabbitMQ publisher
order-service/      same layering, calls catalog-service over HTTP
search-service/     RabbitMQ consumer + Elasticsearch index and search
migrations/         numbered raw SQL, applied by Postgres on first boot
docker-compose.yml  full stack definition
```

Each service follows the same layering: routes (HTTP wiring) -> controller (request/response) -> service (business rules, ownership checks) -> queries (raw SQL).

## Database design

- UUID primary keys (no ID enumeration on public endpoints)
- Money as integer cents, never floats
- `created_at` / `updated_at` on every table, soft deletes on user-facing data
- `CHECK` constraints enforce valid states in the database itself (roles, order statuses, non-negative price and stock)

## Known limitations

These are conscious scope decisions, listed here rather than hidden:

- **No compensation if an order insert fails after stock was reserved.** Catalog-service decrements stock over HTTP, then order-service writes the order; if that second step fails, stock stays decremented. A production system would need a saga or outbox pattern.
- **`POST /products/reserve-stock` is an internal endpoint with no service-to-service auth, and because the gateway proxies all of `/products`, it is reachable from outside.** It needs to be blocked at the gateway or protected with an internal API key.
- All services share one PostgreSQL database; table ownership is enforced by convention, not by separate databases.
- JWTs are signed with a shared secret; asymmetric signing (RS256) would let only auth-service hold the signing key.
- A multi-seller order is authorized per line item rather than split into per-seller sub-orders.
- Revoked refresh tokens are retained and there is no cleanup job yet.
- No payment integration; order status transitions are manual.

## Possible next steps

Search facets and autocomplete, per-service databases, outbox pattern for reliable event publishing, an internal API key for service-to-service calls, and migrating the query layer to an ORM.