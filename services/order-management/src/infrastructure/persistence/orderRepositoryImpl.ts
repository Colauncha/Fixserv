import { OrderModel } from "./models/orderModel";
import { Order } from "../../domain/entities/order";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { OrderRepository } from "../../domain/repositories/orderRepository";

export class orderRepositoryImpls implements OrderRepository {
  constructor(private orderModel: typeof OrderModel) {}

  async save(order: Order): Promise<Order> {
    const data = this.toPersistence(order);
    const created = await OrderModel.create(data);
    return this.toDomain(created.toObject());
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findById(id).lean();

    return doc ? this.toDomain(doc) : null;
  }

  async findByClientId(clientId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ clientId }).lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByArtisanId(artisanId: string): Promise<Order[]> {
    const docs = await this.orderModel.find({ artisanId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findPublicOrders(): Promise<Order[]> {
    const docs = await OrderModel.find({ status: { $ne: "CANCELLED" } }).lean();
    return Promise.all(docs.map((doc) => this.toDomain(doc)));
  }

  async update(order: Order): Promise<void> {
    const data = this.toPersistence(order);

    await OrderModel.findByIdAndUpdate(order.id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await OrderModel.findByIdAndDelete(id);
  }

  // New methods for artisan response feature
  async findExpiredPendingOrders(): Promise<Order[]> {
    const docs = await OrderModel.find({
      status: "PENDING_ARTISAN_RESPONSE",
      artisanResponseDeadline: { $lt: new Date() },
    }).lean();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findPendingOrdersForArtisan(artisanId: string): Promise<Order[]> {
    const docs = await OrderModel.find({
      artisanId,
      status: "PENDING_ARTISAN_RESPONSE",
      artisanResponseDeadline: { $gt: new Date() }, // Only non-expired orders
    }).lean();

    return docs.map((doc) => this.toDomain(doc));
  }

  toDomain(raw: any): Order {
    return new Order(
      raw._id,
      raw.clientId,
      raw.artisanId,
      raw.serviceId,
      raw.price,
      raw.clientAddress,
      raw.status,
      raw.escrowStatus,
      raw.deviceType,
      raw.deviceBrand,
      raw.deviceModel,
      raw.serviceRequired,
      raw.paymentReference,
      new Date(raw.createdAt),
      raw.completedAt ? new Date(raw.completedAt) : undefined,
      raw.disputeId,
      raw.uploadedProducts || [],
      raw.artisanResponse
        ? {
            ...raw.artisanResponse,
            respondedAt: new Date(raw.artisanResponse.respondedAt),
            estimatedCompletionDate: raw.artisanResponse.estimatedCompletionDate
              ? new Date(raw.artisanResponse.estimatedCompletionDate)
              : undefined,
          }
        : undefined,
      raw.artisanResponseDeadline
        ? new Date(raw.artisanResponseDeadline)
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
      // Restore statusHistory, with fallback for old orders that don't have it
      Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0
        ? raw.statusHistory.map((entry: any) => ({
            status: entry.status,
            timestamp: new Date(entry.timestamp),
            note: entry.note,
          }))
        : [{ status: raw.status, timestamp: new Date(raw.createdAt) }],
    );
  }
  toPersistence(order: Order): any {
    return {
      _id: order.id,
      clientId: order.clientId,
      artisanId: order.artisanId,
      serviceId: order.serviceId,
      price: order.price,
      clientAddress: order.clientAddress,
      status: order.status,
      escrowStatus: order.escrowStatus,
      deviceType: order.deviceType,
      deviceBrand: order.deviceBrand,
      deviceModel: order.deviceModel,
      serviceRequired: order.serviceRequired,
      paymentReference: order.paymentReference,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      disputeId: order.disputeId ?? null,
      uploadedProducts: order.uploadedProducts.map((product) => ({
        id: product.id,
        imageUrl: product.imageUrl,
        description: product.description,
        objectName: product.objectName,
        uploadedAt: product.uploadedAt,
      })),
      artisanResponse: order.artisanResponse
        ? {
            status: order.artisanResponse.status,
            respondedAt: order.artisanResponse.respondedAt,
            rejectionReason: order.artisanResponse.rejectionReason,
            rejectionNote: order.artisanResponse.rejectionNote,
            estimatedCompletionDate:
              order.artisanResponse.estimatedCompletionDate,
          }
        : undefined,
      artisanResponseDeadline: order.artisanResponseDeadline,
      statusHistory: order.statusHistory,
    };
  }
  //GMV = Gross Merchandise Value — it's the total value of all transactions processed through your platform over a given period, regardless of whether the platform took a cut or not. In your case it's the total value of all completed orders.

  async getGMV(period: "today" | "week" | "month" | "all" = "all"): Promise<{
    total: number;
    period: string;
    orderCount: number;
  }> {
    const matchStage: any = { status: "COMPLETED" };

    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
        startDate = null;
        break;
    }

    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }

    const result = await OrderModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGMV: { $sum: "$price" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    return {
      total: result[0]?.totalGMV || 0,
      orderCount: result[0]?.orderCount || 0,
      period,
    };
  }

  async getTransactionStats(
    period: "today" | "week" | "month" = "today",
  ): Promise<{
    period: string;
    total: number;
    completed: number;
    pending: number;
    rejected: number;
    cancelled: number;
    inProgress: number;
    totalValue: number;
    completedValue: number;
    averageOrderValue: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const result = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$price" },
        },
      },
    ]);

    // Build stats from aggregation result
    const statsMap: Record<string, { count: number; value: number }> = {};
    result.forEach((item: any) => {
      statsMap[item._id] = { count: item.count, value: item.totalValue };
    });

    const total = Object.values(statsMap).reduce((sum, s) => sum + s.count, 0);
    const totalValue = Object.values(statsMap).reduce(
      (sum, s) => sum + s.value,
      0,
    );
    const completedCount = statsMap["COMPLETED"]?.count || 0;
    const completedValue = statsMap["COMPLETED"]?.value || 0;

    return {
      period,
      total,
      completed: completedCount,
      pending: statsMap["PENDING_ARTISAN_RESPONSE"]?.count || 0,
      rejected: statsMap["REJECTED"]?.count || 0,
      cancelled: statsMap["CANCELLED"]?.count || 0,
      inProgress: statsMap["IN_PROGRESS"]?.count || 0,
      totalValue,
      completedValue,
      averageOrderValue: total > 0 ? totalValue / total : 0,
    };
  }

  async getRevenueBreakdown(): Promise<{
    daily: { date: string; value: number; count: number }[];
    weekly: { week: string; value: number; count: number }[];
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyResult = await OrderModel.aggregate([
      {
        $match: {
          status: "COMPLETED",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          value: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const daily = dailyResult.map((item: any) => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`,
      value: item.value,
      count: item.count,
    }));

    const weeklyResult = await OrderModel.aggregate([
      {
        $match: {
          status: "COMPLETED",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          },
          value: { $sum: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weekly = weeklyResult.map((item: any) => ({
      week: `${item._id.year}-W${String(item._id.week).padStart(2, "0")}`,
      value: item.value,
      count: item.count,
    }));

    return { daily, weekly };
  }

  async getDisputeStats(): Promise<{
    total: number;
    open: number;
    resolved: number;
    disputedOrders: any[];
  }> {
    const [disputedOrders, totalDisputed] = await Promise.all([
      OrderModel.find({ status: "DISPUTED" })
        .select(
          "_id clientId artisanId serviceId price createdAt disputeId statusHistory",
        )
        .sort({ createdAt: -1 })
        .lean(),
      OrderModel.countDocuments({ status: "DISPUTED" }),
    ]);

    // Calculate how long each dispute has been open
    const disputedOrdersWithDuration = disputedOrders.map((order: any) => {
      const disputedEntry = order.statusHistory?.find(
        (h: any) => h.status === "DISPUTED",
      );
      const disputedAt = disputedEntry?.timestamp || order.createdAt;
      const hoursOpen = Math.floor(
        (Date.now() - new Date(disputedAt).getTime()) / (1000 * 60 * 60),
      );

      return {
        orderId: order._id,
        clientId: order.clientId,
        artisanId: order.artisanId,
        serviceId: order.serviceId,
        price: order.price,
        disputeId: order.disputeId,
        disputedAt,
        hoursOpen,
        daysOpen: Math.floor(hoursOpen / 24),
        isUrgent: hoursOpen > 48, // flag disputes open more than 48 hours
      };
    });

    // Separate urgent from normal
    const urgent = disputedOrdersWithDuration.filter((d) => d.isUrgent);
    const normal = disputedOrdersWithDuration.filter((d) => !d.isUrgent);

    return {
      total: totalDisputed,
      open: totalDisputed,
      resolved: 0, // disputes are removed from DISPUTED status when resolved
      //urgent: urgent.length,
      //normal: normal.length,
      disputedOrders: [
        ...urgent, // urgent first
        ...normal,
      ],
    };
  }

  async resolveDispute(
    orderId: string,
    resolution: "REFUND_CLIENT" | "RELEASE_TO_ARTISAN",
    adminId: string,
    note?: string,
  ): Promise<Order> {
    const order = await OrderModel.findById(orderId).lean();
    if (!order) throw new BadRequestError("Order not found");

    if (order.status !== "DISPUTED") {
      throw new BadRequestError("Order is not in disputed state");
    }

    const newStatus =
      resolution === "REFUND_CLIENT" ? "CANCELLED" : "COMPLETED";
    const now = new Date();

    const updated = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: newStatus,
          escrowStatus:
            resolution === "REFUND_CLIENT" ? "NOT_PAID" : "RELEASED",
          updatedAt: now,
        },
        $push: {
          statusHistory: {
            status: newStatus,
            timestamp: now,
            note: `Dispute resolved by admin ${adminId}: ${resolution}. ${note || ""}`,
          },
        },
      },
      { new: true },
    ).lean();

    return this.toDomain(updated);
  }
}
