#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
STAMP="$(date +%s)"
SELLER="seller-$STAMP@example.com"
BUYER="buyer-$STAMP@example.com"
PASS="password123"

json() { grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4; }

echo "1/7 waiting for the stack"
for i in $(seq 1 60); do
  curl -sf "$BASE/products/search" >/dev/null && break
  [ "$i" -eq 60 ] && { echo "stack never became ready"; exit 1; }
  sleep 3
done

echo "2/7 seller signup and promotion"
curl -sf -X POST "$BASE/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"$SELLER\",\"password\":\"$PASS\"}" >/dev/null
docker compose exec -T postgres psql -U marketplace -d marketplace_dev \
  -c "UPDATE users SET role='seller' WHERE email='$SELLER';" >/dev/null

echo "3/7 seller logs in and creates a product"
SELLER_TOKEN=$(curl -sf -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$SELLER\",\"password\":\"$PASS\"}" | json accessToken)
PRODUCT_ID=$(curl -sf -X POST "$BASE/products" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -d "{\"name\":\"Smoke Keyboard $STAMP\",\"description\":\"ci\",\"priceCents\":1500,\"stockQuantity\":3}" | json id)

echo "4/7 product reaches Elasticsearch through RabbitMQ"
for i in $(seq 1 20); do
  curl -sf "$BASE/products/search?q=$STAMP" | grep -q "$PRODUCT_ID" && break
  [ "$i" -eq 20 ] && { echo "product never appeared in search"; exit 1; }
  sleep 1
done

echo "5/7 buyer places an order (order-service calls catalog-service)"
curl -sf -X POST "$BASE/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER\",\"password\":\"$PASS\"}" >/dev/null
BUYER_TOKEN=$(curl -sf -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER\",\"password\":\"$PASS\"}" | json accessToken)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/orders" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]}")
[ "$STATUS" = "201" ] || { echo "expected 201, got $STATUS"; exit 1; }

echo "6/7 ordering more than the remaining stock is rejected"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/orders" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $BUYER_TOKEN" \
  -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":99}]}")
[ "$STATUS" = "409" ] || { echo "expected 409, got $STATUS"; exit 1; }

echo "7/7 internal endpoint is not reachable through the gateway"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/products/reserve-stock" \
  -H "Content-Type: application/json" -d '{"buyerId":"x","items":[]}')
[ "$STATUS" = "404" ] || { echo "expected 404, got $STATUS"; exit 1; }

echo "smoke test passed"