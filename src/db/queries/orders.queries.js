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