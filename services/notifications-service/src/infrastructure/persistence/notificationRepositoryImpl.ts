import { Notification } from "../../domain/entities/notification";
import { NotificationPreference } from "../../domain/entities/notificationPreferences";
import { INotificationRepository } from "../../domain/repository/notificationRepository";
import { NotificationId } from "../../domain/value-objects/notificationId";
import { NotificationStatus } from "../../domain/value-objects/notificationStatus";
import { NotificationType } from "../../domain/value-objects/notificationTypes";
import {
  NotificationModel,
  NotificationPreferenceModel,
  NotificationReadTrackingModel,
  NotificationDismissedModel,
} from "./models/notificationModel";

export class NotificationRepositoryImpl implements INotificationRepository {
  async save(notification: Notification): Promise<void> {
    try {
      //const data = notification.toJSON();

      //const notificationDoc = new NotificationModel({
      //  userId: data.userId,
      //  type: data.type,
      //  title: data.title,
      //  message: data.message,
      //  data: data.data,
      //  status: data.status,
      //  readAt: data.readAt ? new Date(data.readAt) : undefined,
      //  createdAt: new Date(data.createdAt),
      //});
      const notificationData = {
        userId: notification.userId,
        type: notification.type.value,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: notification.status.value,
        readAt: notification.readAt,
      };

      // await notificationDoc.save();
      // console.log(`Notification saved: ${data.id}`);
      const doc = new NotificationModel(notificationData);
      await doc.save();
    } catch (error: any) {
      console.error("Error saving notification:", error);
      throw new Error(`Failed to save notification: ${error.message}`);
    }
  }
  /*
  async findById(id: NotificationId): Promise<Notification | null> {
    try {
      const doc = await NotificationModel.findOne({ id: id.value }).lean();
      if (!doc) return null;

      return this.toDomain(doc);
    } catch (error: any) {
      console.error("Error finding notification by id:", error);
      throw new Error(`Failed to find notification: ${error.message}`);
    }
  }
    */
  async findById(id: NotificationId): Promise<Notification | null> {
    try {
      console.log("Looking for notification with ID:", id.value); // Debug log

      // Try finding by _id (MongoDB's default)
      const doc = await NotificationModel.findById(id.value);

      console.log("Found document:", doc ? "Yes" : "No"); // Debug log

      if (!doc) return null;

      return this.toDomain(doc);
    } catch (error) {
      console.error("Error in findById:", error);
      return null;
    }
  }

  async findByUserId(
    userId: string,
    userRole: string,
    limit = 20,
    offset = 0,
  ): Promise<Notification[]> {
    try {
      // const docs = await NotificationModel.find({ userId })
      // .sort({ createdAt: -1 })
      // .skip(offset)
      // .limit(limit)
      // .lean();
      /*
      const docs = await NotificationModel.find({
        $or: [
          { userId }, // personal notifications
          { targetRole: userRole }, // role-based broadcasts
          { targetRole: "ALL" }, // global broadcasts
        ],
      })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      return docs.map((doc) => this.toDomain(doc));
      */
      // Get IDs of notifications this user has dismissed
      const dismissed = await NotificationDismissedModel.find({ userId })
        .select("notificationId")
        .lean();
      const dismissedIds = dismissed.map((d) => d.notificationId);

      // Get IDs of broadcast notifications this user has read
      const readTracking = await NotificationReadTrackingModel.find({ userId })
        .select("notificationId readAt")
        .lean();
      const readMap = new Map(
        readTracking.map((r) => [r.notificationId, r.readAt]),
      );

      const docs = await NotificationModel.find({
        _id: { $nin: dismissedIds }, // exclude dismissed
        $or: [{ userId }, { targetRole: userRole }, { targetRole: "ALL" }],
      })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      return docs.map((doc) => {
        // For broadcast notifications, use tracking table for read status
        const isBroadcast = !!doc.targetRole;
        if (isBroadcast) {
          const readAt = readMap.get(doc._id.toString());
          doc.status = readAt ? "read" : "unread";
          doc.readAt = readAt || undefined;
        }
        return this.toDomain(doc);
      });
    } catch (error: any) {
      console.error("Error finding notifications by userId:", error);
      throw new Error(
        `Failed to find notifications for user: ${error.message}`,
      );
    }
  }

  async findUnreadByUserId(
    userId: string,
    userRole: string,
  ): Promise<Notification[]> {
    try {
      // const docs = await NotificationModel.find({ userId, status: "unread" })
      // .sort({ createdAt: -1 })
      // .lean();
      /*
      const docs = await NotificationModel.find({
        $or: [
          { userId, status: "unread" },
          { targetRole: userRole, status: "unread" },
          { targetRole: "ALL", status: "unread" },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map((doc) => this.toDomain(doc));
      */
      const dismissed = await NotificationDismissedModel.find({ userId })
        .select("notificationId")
        .lean();
      const dismissedIds = dismissed.map((d) => d.notificationId);

      const readTracking = await NotificationReadTrackingModel.find({ userId })
        .select("notificationId")
        .lean();
      const readIds = readTracking.map((r) => r.notificationId);

      const docs = await NotificationModel.find({
        _id: {
          $nin: [...dismissedIds, ...readIds], // exclude dismissed AND read broadcasts
        },
        $or: [
          { userId, status: "unread" }, // personal unread
          { targetRole: userRole }, // broadcast (unread tracked separately)
          { targetRole: "ALL" },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      return docs.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      console.error("Error finding unread notifications:", error);
      throw new Error(`Failed to find unread notifications: ${error.message}`);
    }
  }

  /*
  async update(notification: Notification): Promise<void> {
    try {
      const data = notification.toJSON();

      await NotificationModel.updateOne(
        { id: data.id },
        {
          $set: {
            status: data.status,
            readAt: data.readAt ? new Date(data.readAt) : undefined,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`Notification updated: ${data.id}`);
    } catch (error: any) {
      console.error("Error updating notification:", error);
      throw new Error(`Failed to update notification: ${error.message}`);
    }
  }

  */
  async delete(id: NotificationId, userId: string): Promise<void> {
    try {
      // await NotificationModel.deleteOne({ id: id.value });
      /*
      await NotificationModel.findByIdAndDelete(id.value);
      console.log(`Notification deleted: ${id.value}`);
      */
      const doc = await NotificationModel.findById(id.value);
      if (!doc) throw new Error("Notification not found");

      if (doc.targetRole) {
        // Broadcast — don't delete the doc, just track dismissal for this user
        await NotificationDismissedModel.findOneAndUpdate(
          { notificationId: id.value, userId },
          { notificationId: id.value, userId, dismissedAt: new Date() },
          { upsert: true },
        );
      } else {
        // Personal notification — actually delete it
        await NotificationModel.findByIdAndDelete(id.value);
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
  async update(notification: Notification): Promise<void> {
    try {
      /*
      console.log("Updating notification with ID:", notification.id.value);
      console.log("New status:", notification.status.value);
      console.log("New readAt:", notification.readAt);

      const updateData = {
        status: notification.status.value,
        readAt: notification.readAt,
      };

      console.log("Update data:", updateData);

      const result = await NotificationModel.findByIdAndUpdate(
        notification.id.value,
        updateData,
        {
          new: true, // Return updated document
          runValidators: true, // Run schema validators
        },
      );

      console.log("Update result:", result ? "Success" : "Failed");
      console.log("Updated document status:", result?.status);
      console.log("Updated document readAt:", result?.readAt);

      if (!result) {
        throw new Error("Failed to update notification - document not found");
      }
        */
      const doc = await NotificationModel.findById(notification.id.value);
      if (!doc) throw new Error("Notification not found");

      if (doc.targetRole) {
        // Broadcast notification — track read state per user separately
        // The userId comes from the service layer (the person marking it read)
        await NotificationReadTrackingModel.findOneAndUpdate(
          {
            notificationId: notification.id.value,
            userId: notification.userId,
          },
          {
            notificationId: notification.id.value,
            userId: notification.userId,
            readAt: new Date(),
          },
          { upsert: true },
        );
      } else {
        // Personal notification — update the document directly
        await NotificationModel.findByIdAndUpdate(
          notification.id.value,
          { status: notification.status.value, readAt: notification.readAt },
          { new: true },
        );
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const now = new Date();

      await NotificationModel.updateMany(
        { userId, status: "unread" },
        {
          $set: {
            status: "read",
            readAt: now,
            updatedAt: now,
          },
        },
      );

      console.log(`All notifications marked as read for user: ${userId}`);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      throw new Error(`Failed to mark notifications as read: ${error.message}`);
    }
  }

  async savePreferences(preferences: NotificationPreference): Promise<void> {
    try {
      await NotificationPreferenceModel.findOneAndUpdate(
        { userId: preferences.userId },
        {
          $set: {
            emailEnabled: preferences.emailEnabled,
            pushEnabled: preferences.pushEnabled,
            smsEnabled: preferences.smsEnabled,
            categories: preferences.categories,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      console.log(
        `Notification preferences saved for user: ${preferences.userId}`,
      );
    } catch (error: any) {
      console.error("Error saving notification preferences:", error);
      throw new Error(`Failed to save preferences: ${error.message}`);
    }
  }

  async findPreferencesByUserId(
    userId: string,
  ): Promise<NotificationPreference | null> {
    try {
      const doc = await NotificationPreferenceModel.findOne({ userId }).lean();
      if (!doc) return null;

      return new NotificationPreference(
        doc.userId,
        doc.emailEnabled,
        doc.pushEnabled,
        doc.smsEnabled,
        doc.categories,
      );
    } catch (error: any) {
      console.error("Error finding notification preferences:", error);
      throw new Error(`Failed to find preferences: ${error.message}`);
    }
  }

  // Additional utility methods for better query performance
  async countUnreadByUserId(userId: string, userRole: string): Promise<number> {
    try {
      /*
      return await NotificationModel.countDocuments({
        $or: [
          { userId, status: "unread" },
          { targetRole: userRole, status: "unread" },
          { targetRole: "ALL", status: "unread" },
        ],
      });
      */
      const dismissed = await NotificationDismissedModel.find({ userId })
        .select("notificationId")
        .lean();
      const dismissedIds = dismissed.map((d) => d.notificationId);

      const readTracking = await NotificationReadTrackingModel.find({ userId })
        .select("notificationId")
        .lean();
      const readIds = readTracking.map((r) => r.notificationId);

      return NotificationModel.countDocuments({
        _id: { $nin: [...dismissedIds, ...readIds] },
        $or: [
          { userId, status: "unread" },
          { targetRole: userRole },
          { targetRole: "ALL" },
        ],
      });
    } catch (error: any) {
      console.error("Error counting unread notifications:", error);
      throw new Error(`Failed to count unread notifications: ${error.message}`);
    }
  }

  async findByUserIdAndType(
    userId: string,
    type: string,
    limit = 10,
  ): Promise<Notification[]> {
    try {
      const docs = await NotificationModel.find({ userId, type })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return docs.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      console.error("Error finding notifications by type:", error);
      throw new Error(`Failed to find notifications by type: ${error.message}`);
    }
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await NotificationModel.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: "read",
      });

      console.log(`Deleted ${result.deletedCount} old notifications`);
      return result.deletedCount || 0;
    } catch (error: any) {
      console.error("Error deleting old notifications:", error);
      throw new Error(`Failed to delete old notifications: ${error.message}`);
    }
  }

  private toDomain(doc: any): Notification {
    return new Notification(
      new NotificationId(doc._id.toString()),
      // new NotificationId(doc.id),
      // NotificationId.fromString(doc._id.toString()),
      doc.userId,
      new NotificationType(doc.type),
      doc.title,
      doc.message,
      doc.data || {},
      // new NotificationStatus(doc.status)
      doc.status === "read"
        ? NotificationStatus.READ
        : NotificationStatus.UNREAD,
      // new Date(doc.createdAt),
      doc.createdAt,
      // doc.readAt ? new Date(doc.readAt) : undefined
      doc.readAt || undefined,
    );
  }

  async saveWithRole(
    notification: Notification,
    targetRole?: string,
  ): Promise<void> {
    try {
      const notificationData = {
        userId: targetRole ? undefined : notification.userId, // null for broadcasts
        targetRole: targetRole || null,
        type: notification.type.value,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: notification.status.value,
        readAt: notification.readAt,
      };

      const doc = new NotificationModel(notificationData);
      await doc.save();
    } catch (error: any) {
      console.error("Error saving notification:", error);
      throw new Error(`Failed to save notification: ${error.message}`);
    }
  }
}
