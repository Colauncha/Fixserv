import { Request, Response } from "express";
import { ArtisanServiceManager } from "../../application/services/artisanServiceManager";

export class ArtisanServiceController {
  constructor(private artisanServiceManager: ArtisanServiceManager) {}

  offerService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { baseServiceId, price, estimatedDuration, skillSet } = req.body;
      const artisanId = req.currentUser!.id; // from auth middleware

      const offeredService = await this.artisanServiceManager.offerService(
        artisanId,
        baseServiceId,
        price,
        estimatedDuration,
        skillSet
      );

      res.status(201).json({
        success: true,
        data: offeredService,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Error offering service",
      });
    }
  };
}
