import { placeOrder } from "./orders.service.js";

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
