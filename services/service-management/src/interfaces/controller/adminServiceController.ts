import { Request, Response } from "express";
import { AdminServiceManager } from "../../application/services/adminService";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class AdminServiceController {
  constructor(private adminServiceManager: AdminServiceManager) {}

  createBaseService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description } = req.body;
      const createdBy = req.currentUser!.id; // assuming authentication middleware attaches currentUser

      const baseService = await this.adminServiceManager.createService(
        title,
        description,
        createdBy
      );

      res.status(201).json({ success: true, data: baseService });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to create base service",
        error: err instanceof Error ? err.message : err,
      });
    }
  };

  getAllBaseServices = async (_req: Request, res: Response): Promise<void> => {
    try {
      const services = await this.adminServiceManager.listAllServices();
      res.status(200).json({ success: true, data: services });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch base services",
        error: err instanceof Error ? err.message : err,
      });
    }
  };

  getBaseServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const baseService = await this.adminServiceManager.getBaseServiceById(id);
      res.status(200).json({ success: true, data: baseService });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  };

  getOfferedServiceById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const offeredService =
        await this.adminServiceManager.getOfferedServiceById(id);
      res.status(200).json({ success: true, data: offeredService });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  };

  deleteBaseService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.adminServiceManager.deleteService(id);
      res.status(200).json({ success: true, message: "Service deleted" });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to delete service",
        error: err instanceof Error ? err.message : err,
      });
    }
  };
}
