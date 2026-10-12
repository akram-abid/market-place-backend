import { pool } from "../../config/db.js";

export async function lockProductForUpdate(client, productId) {
  const result = await client.query(
    "select * from products where id = $1 and deleted_at is null for update",
    [productId],
  );

  return result.rows[0];
}

export async function decrementStock(client, productId, quantity) {
  const result = await client.query(
    `
        update products set stock_quantity = stock_quantity - $2
        where id = $1 and deleted_at is null 
        returning *
        `,
    [productId, quantity],
  );
  return result.rows;
}

export async function insertOrder(client, { buyerId, totalCents }) {
  const result = await client.query(
    `
        insert into orders (buyer_id, total_cents)
        values ($1, $2) 
        returning *
        `,
    [buyerId, totalCents],
  );
  return result.rows[0];
}

export async function insertOrderItems(
  client,
  { orderId, productId, productNameSnapshot, unitPriceCentsSnapshot, quantity },
) {
  const result = await client.query(
    `
        insert into order_items (order_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity)
        values ($1, $2, $3, $4, $5)
        returning *
        `,
    [orderId, productId, productNameSnapshot, unitPriceCentsSnapshot, quantity],
  );
  return result.rows[0];
}

export async function findOrderById(id) {
  const result = await pool.query(
    `
    select * from orders where id = $1
    `,
    [id],
  );
  return result.rows[0];
}

export async function findOrderItemsByOrderId(orderId) {
  const result = await pool.query(
    `
    select * from order_items where order_id = $1
    `,
    [orderId],
  );

  return result.rows;
}

export async function listOrdersByBuyerId(buyerId, { limit, offset }) {
  const result = await pool.query(
    `
    select * from orders where buyer_id = $1 order by created_at desc limit $2 offset $3
    `,
    [buyerId, limit, offset],
  );
  return result.rows;
}

// orders.service.js — updateOrderStatusForSeller

const ALLOWED_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

export async function updateOrderStatusForSeller({
  orderId,
  sellerId,
  status,
}) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }

  const orderItems = await findOrderItemsByOrderId(orderId);

  let isSellerOfSomeItem = false;
  for (const item of orderItems) {
    const product = await findProductById(item.product_id);
    if (product && product.seller_id === sellerId) {
      isSellerOfSomeItem = true;
      break;
    }
  }

  if (!isSellerOfSomeItem) {
    throw new Error("NOT_ORDER_SELLER");
  }

  const result = await updateOrderStatus({ orderId, status });
  return result;
}
