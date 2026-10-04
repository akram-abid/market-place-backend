import { pool } from "../../config/db.js";

export async function createProduct({
  sellerId,
  categoryId,
  name,
  description,
  priceCents,
  stockQuantity,
}) {
  const result = await pool.query(
    `insert into products (seller_id, category_id, name, description, price_cents, stock_quantity)
    values ($1, $2, $3, $4, $5, $6)
    returning *
        `,
    [sellerId, categoryId, name, description, priceCents, stockQuantity],
  );
  return result.rows[0];
}

export async function findProductById(id) {
  const result = await pool.query(
    `
        select * from products where id = $1
        `,
    [id],
  );

  return result.rows[0];
}

export async function listProducts({ limit = 20, offset = 0 }) {
  const result = await pool.query(
    `
        select * from products where deleted_at is null order by created_at desc limit $1 offset $2
        `,
    [limit, offset],
  );

  return result.rows;
}
