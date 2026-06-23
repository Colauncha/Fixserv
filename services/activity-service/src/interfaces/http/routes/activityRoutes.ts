import { Router, Request, Response } from "express";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { ActivityController } from "../../controllers/activityController";

const router = Router();
const authMiddleware = new AuthMiddleware();

router.get(
  "/summary",
  authMiddleware.protect,
  requireRole("ADMIN"),
  ActivityController.getSummary.bind(ActivityController),
);

router.get(
  "/all",
  authMiddleware.protect,
  requireRole("ADMIN"),
  ActivityController.getAll.bind(ActivityController),
);
router.get(
  "/users/:userId",
  authMiddleware.protect,
  requireRole("ADMIN"),
  ActivityController.getUserActivity.bind(ActivityController),
);

router.get(
  "/targets/:targetId",
  authMiddleware.protect,
  requireRole("ADMIN"),
  ActivityController.getTargetActivity.bind(ActivityController),
);

export { router as activityRouter };
