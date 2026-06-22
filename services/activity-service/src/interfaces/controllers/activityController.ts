import { Request, Response } from "express";
import { ActivityQueryService } from "../../application/services/activityQueryService";

export class ActivityController {
  // GET /api/activity/summary
  static async getSummary(req: Request, res: Response) {
    const data = await ActivityQueryService.getSummary();
    res.status(200).json({ success: true, data });
  }

  // GET /api/activity/all?role=CLIENT&action=ORDER_CREATED&service=order-service&from=2025-01-01&page=1
  static async getAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
    const data = await ActivityQueryService.getAllActivity(page, limit, {
      role: req.query.role as any,
      action: req.query.action as string,
      service: req.query.service as string,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    });
    res.status(200).json({ success: true, data });
  }

  // GET /api/activity/users/:userId
  static async getUserActivity(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const data = await ActivityQueryService.getUserActivity(
      req.params.userId,
      page,
      limit,
    );
    res.status(200).json({ success: true, data });
  }

  // GET /api/activity/targets/:targetId   (e.g. an orderId)
  static async getTargetActivity(req: Request, res: Response) {
    const data = await ActivityQueryService.getTargetActivity(
      req.params.targetId,
    );
    res.status(200).json({ success: true, data });
  }
}
