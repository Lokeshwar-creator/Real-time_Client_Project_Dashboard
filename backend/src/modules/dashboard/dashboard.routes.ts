import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  getDashboardController,
} from "./dashboard.controller";

const router =
  Router();

router.use(
  authenticate
);

router.get(
  "/",
  getDashboardController
);

export default router;