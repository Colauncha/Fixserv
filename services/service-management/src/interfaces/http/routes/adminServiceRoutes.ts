import express from "express";
import { requireRole, AuthMiddleware } from "@fixserv-colauncha/shared"; // use your actual middlewares
import { BaseServiceRepositoryImpl } from "../../../infrastructure/baseServiceRepoImpl";

import { AdminServiceManager } from "../../../application/services/adminService";
import { AdminServiceController } from "../../controller/adminServiceController";
import { OfferedServiceRepositoryImpl } from "../../../infrastructure/offeredServiceRepoImpl";
const router = express.Router();
const authMiddleware = new AuthMiddleware(); // assuming you have an AuthMiddleware class
// setup
const baseServiceRepo = new BaseServiceRepositoryImpl();
const offeresServiceRepo = new OfferedServiceRepositoryImpl();
const adminServiceManager = new AdminServiceManager(
  baseServiceRepo,
  offeresServiceRepo
);
const controller = new AdminServiceController(adminServiceManager);

// routes
router.post(
  "/",
  authMiddleware.protect,
  requireRole("ADMIN"),
  controller.createBaseService
);
router.get("/getAll", controller.getAllBaseServices);
router.get("/get/:id", controller.getBaseServiceById);
router.get("/getOffered/:id", controller.getOfferedServiceById);
router.delete(
  "/delete/:id",
  authMiddleware.protect,
  requireRole("ADMIN"),
  controller.deleteBaseService
);

export { router as adminServiceRoutes };
