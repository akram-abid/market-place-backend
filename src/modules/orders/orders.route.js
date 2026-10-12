import { Router } from "express";
import {
  getOrderController,
  listOrdersController,
  placeOrderController,
  updateOrderStatusController,
} from "./orders.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.post("/", requireAuth, placeOrderController);
router.get("/", requireAuth, listOrdersController);
router.get("/:id", requireAuth, getOrderController);
router.patch("/:id", requireAuth, requireRole("seller"), updateOrderStatusController)

export default router;
