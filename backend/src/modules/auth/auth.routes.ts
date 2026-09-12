import { Router } from "express";
import {
  loginController,
  refreshController,
  logoutController,
} from "./auth.controller";

const router = Router();

router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);

export default router;