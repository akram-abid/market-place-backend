import { Router } from "express";
import { searchProductsController } from "./products.controller.js";

const router = Router();
router.get("/search", searchProductsController);

export default router;
