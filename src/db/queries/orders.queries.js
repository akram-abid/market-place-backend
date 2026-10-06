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
  const result = await client.query(`
        insert into orders (buyer_id, total_cents)
        values ($1, $2) 
        returning *
        `, [buyerId, totalCents]);
  return result.rows[0];
}

export async function insertOrderItems(
  client,
  {
    orderId,
    productId,
    productNameSnapshot,
    unitPriceCentsSnapshot,
    quantity,
  },
) {
    const result = await client.query(`
        insert into order_items (order_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity)
        values ($1, $2, $3, $4, $5)
        returning *
        `, [orderId, productId, productNameSnapshot, unitPriceCentsSnapshot, quantity])
    return result.rows[0]
}
