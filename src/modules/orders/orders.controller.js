import {
  getOrderForBuyer,
  listOrdersForBuyer,
  placeOrder,
  updateOrderStatusForBuyer,
} from "./orders.service.js";

export async function placeOrderController(req, res) {
  try {
    const buyerId = req.user.id;
    const items = req.body.items;

    const result = await placeOrder({ buyerId, items });

    return res.status(201).json({ result });
  } catch (err) {
    if (err.message === "PRODUCT_NOT_FOUND") {
      return res
        .status(404)
        .json({ error: "the product you requested not found" });
    }
    if (err.message === "CANNOT_BUY_OWN_PRODUCT") {
      return res.status(403).json({ error: "you cannot buy you own product" });
    }
    if (err.message === "INSUFFICIENT_STOCK") {
      return res
        .status(409)
        .json({ error: "there not enough stock of this product" });
    }

    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function getOrderController(req, res) {
  try {
    const orderId = req.params.id;
    const buyerId = req.user.id;
    const result = await getOrderForBuyer({ buyerId, orderId });

    return res.status(200).json({ order: result });
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "order not found" });
    }
    if (error.message === "NOT_ORDER_OWNER") {
      return res.status(403).json({ error: "not the owner of the order" });
    }
    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function listOrdersController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const buyerId = req.user.id;
    const orders = await listOrdersForBuyer({ buyerId, limit, offset });

    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ error: "something went wrong" });
  }
}

export async function updateOrderStatusController(req, res) {
  try {
    const orderId = req.params.id;
    const sellerId = req.user.id;
    const { status } = req.body;

    const updatedOrder = await updateOrderStatusForSeller({
      orderId,
      sellerId,
      status,
    });

    return res.status(200).json({ updatedOrder });
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "order not found" });
    }
    if (error.message === "NOT_ORDER_SELLER") {
      return res.status(403).json({ error: "you don't sell any items in this order" });
    }
    if (error.message === "INVALID_STATUS") {
      return res.status(400).json({ error: "invalid status value" });
    }

    console.error(error);
    return res.status(500).json({ error: "something went wrong" });
  }
}