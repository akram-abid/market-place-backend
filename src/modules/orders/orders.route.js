import { Router } from "express";
import { placeOrderController } from "./orders.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const router = Router();

router.post("/", requireAuth, placeOrderController);

export default router;
