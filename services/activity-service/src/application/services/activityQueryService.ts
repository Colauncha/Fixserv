import { ActivityLogModel } from "../../infrastructure/persistence/models/activityModel";

export class ActivityQueryService {
  // Admin: full log for one user
  static async getUserActivity(actorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActivityLogModel.find({ actorId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLogModel.countDocuments({ actorId }),
    ]);
    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Admin: all activity, filterable
  static async getAllActivity(
    page = 1,
    limit = 30,
    filters: {
      role?: "CLIENT" | "ARTISAN" | "ADMIN";
      action?: string;
      service?: string;
      from?: Date;
      to?: Date;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (filters.role) query.actorRole = filters.role;
    if (filters.action) query.action = filters.action;
    if (filters.service) query.service = filters.service;
    if (filters.from || filters.to) {
      query.timestamp = {};
      if (filters.from) query.timestamp.$gte = filters.from;
      if (filters.to) query.timestamp.$lte = filters.to;
    }

    const [logs, total] = await Promise.all([
      ActivityLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLogModel.countDocuments(query),
    ]);
    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Admin dashboard summary
  static async getSummary() {
    const now = new Date();
    const last15m = new Date(now.getTime() - 15 * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeNow,
      activeToday,
      activeWeek,
      actionBreakdown,
      serviceBreakdown,
    ] = await Promise.all([
      ActivityLogModel.distinct("actorId", { timestamp: { $gte: last15m } }),
      ActivityLogModel.distinct("actorId", { timestamp: { $gte: last24h } }),
      ActivityLogModel.distinct("actorId", { timestamp: { $gte: last7d } }),

      // Top 8 actions in last 24h
      ActivityLogModel.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Activity per service
      ActivityLogModel.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        { $group: { _id: "$service", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      activeNow: activeNow.length,
      activeToday: activeToday.length,
      activeThisWeek: activeWeek.length,
      topActions: actionBreakdown.map((a) => ({
        action: a._id,
        count: a.count,
      })),
      byService: serviceBreakdown.map((s) => ({
        service: s._id,
        count: s.count,
      })),
    };
  }

  // Admin: activity feed for a specific order/target
  static async getTargetActivity(targetId: string) {
    const logs = await ActivityLogModel.find({ targetId })
      .sort({ timestamp: -1 })
      .lean();
    return { logs, total: logs.length };
  }
}
