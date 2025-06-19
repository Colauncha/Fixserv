import express, { Request, Response } from "express";
import { OrderService } from "../../application/services/orderService";

export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, artisanId, serviceId, amount } = req.body;

      const order = await this.orderService.createOrder(
        clientId,
        artisanId,
        serviceId,
        amount
      );

      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { newStatus } = req.body;
      const actorId = req.currentUser!.id; // From auth middleware

      await this.orderService.updateOrderStatus(orderId, newStatus, actorId);

      res.status(200).json({ message: "Order status updated successfully" });
    } catch (error) {
      console.error("Order status update error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }

  async releasePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const clientId = req.currentUser!.id; // From auth middleware

      // Verify the client owns this order
      const order = await this.orderService.getOrder(orderId);
      //if (order.clientId !== clientId) {
      //  throw new Error("Unauthorized to release payment for this //order");
      //}

      await this.orderService.releasePayment(orderId);

      res.status(200).json({ message: "Payment released successfully" });
    } catch (error) {
      console.error("Payment release error:", error);
      res.status(500).json({ error: "Failed to release payment" });
    }
  }
  /*

  async getClientOrders(req: Request, res: Response): Promise<void> {
    try {
      const clientId = req.currentUser!.id;
      const orders = await this.orderService.getClientOrders(clientId);

      res.status(200).json(orders);
    } catch (error) {
      console.error("Get client orders error:", error);
      res.status(500).json({ error: "Failed to get client orders" });
    }
  }

  async getArtisanOrders(req: Request, res: Response): Promise<void> {
    try {
      const artisanId = req.currentUser!.id;
      const orders = await this.orderService.getArtisanOrders(artisanId);

      res.status(200).json(orders);
    } catch (error) {
      console.error("Get artisan orders error:", error);
      res.status(500).json({ error: "Failed to get artisan orders" });
    }
  }
    */
}
