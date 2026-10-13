import { Result } from "pg";
import { pool } from "../../config/db.js";
import {
  lockProductForUpdate,
  decrementStock,
  insertOrder,
  insertOrderItems,
  findOrderById,
  findOrderItemsByOrderId,
  listOrdersByBuyerId,
  updateOrderStatusForSeller,
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

  // call catalog-service to reserve stock
  const response = await fetch(
    `${process.env.CATALOG_SERVICE_URL}/products/reserve-stock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId, items: mergedItems }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || "RESERVE_STOCK_FAILED");
  }

  const { reservedItems } = await response.json();

  // compute total from what catalog-service confirmed was reserved
  let totalCents = 0;
  for (const item of reservedItems) {
    totalCents += item.priceCents * item.quantity;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const order = await insertOrder(client, { buyerId, totalCents });

    for (const item of reservedItems) {
      await insertOrderItems(client, {
        orderId: order.id,
        productId: item.productId,
        productNameSnapshot: item.name,
        unitPriceCentsSnapshot: item.priceCents,
        quantity: item.quantity,
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

export async function getOrderForBuyer({ orderId, buyerId }) {
  const order = await findOrderById(orderId);

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.buyer_id != buyerId) {
    throw new Error("NOT_ORDER_OWNER");
  }
  const orderItems = await findOrderItemsByOrderId(orderId);

  return { ...order, orderItems };
}

export async function listOrdersForBuyer({ buyerId, limit = 20, offset = 0 }) {
  const orders = await listOrdersByBuyerId(buyerId, { limit, offset });
  return orders;
}

export async function updateOrderStatusForBuyer({ orderId, buyerId, stauts }) {
  const order = await findProductById(orderId);

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.buyer_id != buyerId) throw new Error("NOT_ORDER_OWNER");

  const result = await updateOrderStatusForSeller({ orderId, status });

  return result;
}
