import { Router } from "express";
import {
  createProductController,
  deleteProductController,
  getProductController,
  listProductController,
  updateProductController,
} from "./product.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireRole.js";

const router = Router();

router.get("/", listProductController);
router.get("/:id", getProductController);
router.post("/", requireAuth, requireRole("seller"), createProductController);
router.patch(
  "/:id",
  requireAuth,
  requireRole("seller"),
  updateProductController,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("seller"),
  deleteProductController,
);

export default router;
