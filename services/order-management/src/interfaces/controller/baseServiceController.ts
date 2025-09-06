import { Request, Response } from "express";
import { OfferedOrder } from "../../application/services/baseOrderService";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class OfferedOrderController {
  constructor(private orderManager: OfferedOrder) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { offeredServiceId } = req.body;
      const clientId = req.currentUser!.id;

      const order = await this.orderManager.createOrder(
        clientId,
        offeredServiceId
      );

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Error creating order",
      });
    }
  };

  getBaseOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const baseOrder = await this.orderManager.getBaseOrderById(id);
      res.status(200).send(baseOrder);
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  };
}
