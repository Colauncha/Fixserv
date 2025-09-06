import express from "express";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { OfferedOrderController } from "../../controller/baseServiceController";
import { OfferedOrder } from "../../../application/services/baseOrderService";
import { BaseOrderRepositoryImpl } from "../../../infrastructure/persistence/baseOrderRepositoryImpl";

const router = express.Router();

const baseOrderRepo = new BaseOrderRepositoryImpl();
const orderManager = new OfferedOrder(baseOrderRepo);
const controller = new OfferedOrderController(orderManager);

const authMiddleware = new AuthMiddleware();

router.post(
  "/create",
  authMiddleware.protect,
  requireRole("CLIENT"),
  controller.createOrder
);

router.get("/get/:id", controller.getBaseOrder);

export { router as baseOrderRouter };
