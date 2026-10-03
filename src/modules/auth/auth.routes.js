import { Router } from "express";
import {
  loginController,
  refreshController,
  signupController,
} from "./auth.controller.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh", refreshController);

export default router;
