import { Router } from "express";
import { OrderController } from "../../controller/orderController";
import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { OrderService } from "../../../application/services/orderService";
import { orderRepositoryImpls } from "../../../infrastructure/persistence/orderRepositoryImpl";
import { OrderModel } from "../../../infrastructure/persistence/models/orderModel";
import { PaymentService } from "../../../domain/services/paymentService";

const router = Router();
const authMiddleware = new AuthMiddleware();
const orderRepo = new orderRepositoryImpls(OrderModel);
const paymentRepo = new PaymentService();
const orderService = new OrderService(orderRepo, paymentRepo);
const orderController = new OrderController(orderService);

router.post(
  "/create",
  authMiddleware.protect,
  orderController.createOrder.bind(orderController)
);
router.patch(
  "/:orderId/status",
  authMiddleware.protect,
  orderController.updateOrderStatus.bind(orderController)
);
router.post(
  "/:orderId/release-payment",
  authMiddleware.protect,
  orderController.releasePayment.bind(orderController)
);
router.get(
  "/orders/client",
  authMiddleware.protect
  // orderController.getClientOrders.bind(orderController)
);
router.get(
  "/orders/artisan",
  authMiddleware.protect
  // orderController.getArtisanOrders.bind(orderController)
);

export { router as orderRouter };
