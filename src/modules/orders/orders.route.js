import { Router } from "express";
import {
  getOrderController,
  listOrdersController,
  placeOrderController,
} from "./orders.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

router.post("/", requireAuth, placeOrderController);
router.get("/", requireAuth, listOrdersController);
router.get("/:id", requireAuth, getOrderController);

export default router;
