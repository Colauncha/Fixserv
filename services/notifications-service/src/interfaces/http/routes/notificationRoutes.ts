import { Router, Request, Response } from "express";
import { NotificationController } from "../../controllers/notificationController";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { NotificationService } from "../../../application/services/notificationService";
import { NotificationRepositoryImpl } from "../../../infrastructure/persistence/notificationRepositoryImpl";
import { NotificationModel } from "../../../infrastructure/persistence/models/notificationModel";
import { NotificationDomainService } from "../../../application/services/notificationDomainService";
import { RedisEventBus } from "@fixserv-colauncha/shared";
import axios from "axios";

const router = Router();
const authMiddleware = new AuthMiddleware();

// Initialize dependencies
const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
const notificationRepo = new NotificationRepositoryImpl();
const domainService = new NotificationDomainService();
const notificationService = new NotificationService(
  notificationRepo,
  domainService,
  eventBus,
);
const notificationController = new NotificationController(notificationService);

// Get user notifications (authenticated users only)
router.get(
  "/",
  //@ts-ignore
  authMiddleware.protect,
  notificationController.getNotifications.bind(notificationController),
);

// Get unread count
router.get(
  "/unread-count",
  //@ts-ignore
  authMiddleware.protect,
  notificationController.getUnreadCount.bind(notificationController),
);

// Mark specific notification as read
router.patch(
  "/:notificationId/read",
  //@ts-ignore
  authMiddleware.protect,
  notificationController.markAsRead.bind(notificationController),
);

// Mark all notifications as read
router.patch(
  "/mark-all-read",
  //@ts-ignore
  authMiddleware.protect,
  notificationController.markAllAsRead.bind(notificationController),
);

// Delete notification
router.delete(
  "/:notificationId",
  //@ts-ignore
  authMiddleware.protect,
  notificationController.deleteNotification.bind(notificationController),
);

// Create notification (Admin only)
router.post(
  "/create",
  //@ts-ignore
  authMiddleware.protect,
  // requireRole("ADMIN"),
  notificationController.createNotification.bind(notificationController),
);

export { router as notificationRouter };
