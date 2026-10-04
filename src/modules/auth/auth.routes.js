import { Router } from "express";
import {
  loginController,
  logoutController,
  refreshController,
  signupController,
} from "./auth.controller.js";

const router = Router();

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

export default router;
