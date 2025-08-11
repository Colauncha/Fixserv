import { Router } from "express";
import express from "express";
import { OrderController } from "../../controller/orderController";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { OrderService } from "../../../application/services/orderService";
import { orderRepositoryImpls } from "../../../infrastructure/persistence/orderRepositoryImpl";
import { OrderModel } from "../../../infrastructure/persistence/models/orderModel";
import { PaymentService } from "../../../domain/services/paymentService";

const router = Router();
const authMiddleware = new AuthMiddleware();
const orderRepo = new orderRepositoryImpls(OrderModel);
const paymentRepo = new PaymentService();
const orderService = new OrderService(orderRepo);
const orderController = new OrderController(orderService);

router.post(
  "/create",
  authMiddleware.protect,
  requireRole("CLIENT"),
  orderController.createOrder.bind(orderController)
);

router.get("/public", orderController.getPublicOrders.bind(orderController));

router.post(
  "/paystack/webhook",
  express.json(),
  //@ts-ignore
  orderController.webHookHandler.bind(orderController)
);

router.get(
  "/get-signature",
  //@ts-ignore
  orderController.verifySignature.bind(orderController)
);

router.get(
  "/:orderId/getOrder",
  authMiddleware.protect,
  orderController.getAnOrder.bind(orderController)
);
router.patch(
  "/:orderId/complete",
  authMiddleware.protect,
  orderController.markCompleted.bind(orderController)
);
router.post(
  "/:orderId/release-payment",
  authMiddleware.protect,
  orderController.releasePayment.bind(orderController)
);
router.patch(
  "/:orderId/dispute",
  orderController.markDisputed.bind(orderController)
);
router.post(
  "/:orderId/initiate-payment",
  authMiddleware.protect,
  requireRole("CLIENT"),
  orderController.initiatePayment.bind(orderController)
);
router.post(
  "/verify/:reference",
  //@ts-ignore
  orderController.verifyPayment.bind(orderController)
);

export { router as orderRouter };
