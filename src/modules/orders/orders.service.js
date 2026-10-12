import { pool } from "../../config/db.js";
import {
  lockProductForUpdate,
  decrementStock,
  insertOrder,
  insertOrderItems,
} from "../../db/queries/orders.queries.js";

export async function placeOrder({ buyerId, items }) {
  // merge duplicate productIds, summing quantities
  const quantityByProductId = {};
  for (const item of items) {
    if (quantityByProductId[item.productId]) {
      quantityByProductId[item.productId] += item.quantity;
    } else {
      quantityByProductId[item.productId] = item.quantity;
    }
  }
  
  const mergedItems = Object.entries(quantityByProductId).map(
    ([productId, quantity]) => ({ productId, quantity }),
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalCents = 0;
    const lockedItems = [];

    for (const item of mergedItems) {
      const product = await lockProductForUpdate(client, item.productId);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (product.seller_id === buyerId) {
        throw new Error("CANNOT_BUY_OWN_PRODUCT");
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await decrementStock(client, item.productId, item.quantity);

      totalCents += product.price_cents * item.quantity;
      lockedItems.push({ product, quantity: item.quantity });
    }

    const order = await insertOrder(client, { buyerId, totalCents });

    for (const { product, quantity } of lockedItems) {
      await insertOrderItems(client, {
        orderId: order.id,
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceCentsSnapshot: product.price_cents,
        quantity,
      });
    }

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
