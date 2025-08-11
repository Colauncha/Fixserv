import { Request, Response } from "express";
import { NotificationService } from "../../application/services/notificationService";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type, title, message, data } = req.body;

      if (!userId || !type || !title || !message) {
        res.status(400).json({
          success: false,
          message: "userId, type, title, and message are required",
        });
        return;
      }

      await this.notificationService.createNotification({
        userId,
        type,
        title,
        message,
        data: data || {},
      });

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create notification",
        error: error.message,
      });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser!.id;
      const { limit = 20, offset = 0, status } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User authentication required",
        });
        return;
      }

      let notifications;

      if (status === "unread") {
        notifications = await this.notificationService.getUnreadNotifications(
          userId
        );
      } else {
        notifications = await this.notificationService.getUserNotifications(
          userId,
          Number(limit),
          Number(offset)
        );
      }

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: notifications.length,
          hasMore: notifications.length === Number(limit),
        },
        meta: {
          unreadCount,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
        error: error.message,
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser!.id;
      const { notificationId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User authentication required",
        });
        return;
      }

      const metadata = {
        readFrom: (req.headers["x-read-from"] as string) || "web",
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      };

      await this.notificationService.markAsRead(
        notificationId,
        userId,
        metadata
      );

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to mark notification as read",
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser!.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User authentication required",
        });
        return;
      }

      await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: error.message,
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User authentication required",
        });
        return;
      }

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          unreadCount,
          userId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error: error.message,
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser!.id;
      const { notificationId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User authentication required",
        });
        return;
      }

      await this.notificationService.deleteNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete notification",
      });
    }
  }
}
