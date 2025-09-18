import express, { Request, Response } from "express";
import crypto from "crypto";
import { OrderService } from "../../application/services/orderService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { PaystackClient } from "../../infrastructure/reuseableWrapper/paystackClient";
import { OrderModel } from "../../infrastructure/persistence/models/orderModel";
// Change this import to import the enum/object, not just the type
import { RejectionReason } from "../../domain/entities/order";

export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { artisanId, serviceId, price, clientAdress, uploadedProductId } =
        req.body;

      const order = await this.orderService.createOrder(
        req.currentUser!.id,
        artisanId,
        serviceId,
        price,
        clientAdress,
        uploadedProductId
      );

      res.status(201).json(order);
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  async getAnOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrder(orderId);
      res.send(order);
    } catch (error: any) {
      throw new BadRequestError(error);
    }
  }

  getPublicOrders = async (req: Request, res: Response): Promise<void> => {
    const orders = await this.orderService.getPublicOrders();
    res.status(200).json(orders);
  };

  markCompleted = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    await this.orderService.markOrderAsCompleted(orderId);
    res.status(200).json({ message: "Order marked as completed" });
  };

  releasePayment = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    await this.orderService.releasePayment(orderId);
    res.status(200).json({ message: "Payment released to artisan" });
  };

  markDisputed = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { disputeId } = req.body;

    await this.orderService.markAsDisputed(orderId, disputeId);
    res.status(200).json({ message: "Order marked as disputed" });
  };

  initiatePayment = async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const order = await this.orderService.getOrder(orderId);
    if (!order) throw new BadRequestError("Order not found");

    const reference: string = await this.orderService.initiatePayment(orderId);
    const result = await PaystackClient.initializeTransaction({
      email: req.currentUser!.email,
      amount: order.price * 100, // Paystack expects amount in kobo,
      reference,
      callback_url: "http://order-management-srv:4004/api/orders/callback",
    });
    console.log(result);
    // await this.orderService.initiatePayment(orderId);
    res.status(200).json({
      message: "Payment initiated and funds held in escrow",
      authorization_url: result.data.authorization_url,
    });
  };

  verifySignature = async (req: Request, secret: string) => {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    console.log(hash);
    return hash === req.headers["x-paystack-signature"];
  };

  webHookHandler = async (req: Request, res: Response) => {
    if (!(await this.verifySignature(req, process.env.PAYSTACK_SECRET_KEY!))) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      const order = await OrderModel.findOne({ paymentReference: reference });
      if (!order) return res.status(404).send("Order not found");

      // Optionally verify with Paystack (optional but safer)
      const result = await PaystackClient.verifyTransaction(reference);
      if (result.data.status === "success") {
        order.status = "COMPLETED";
        await order.save();

        // Optionally emit event
        // await eventBus.publish("order_events", new PaymentInitiatedEvent(...));
      }
    }

    res.sendStatus(200);
  };
  async verifyPayment(req: Request, res: Response) {
    const { reference } = req.params;
    const result = await PaystackClient.verifyTransaction(reference);
    console.log(result);
    if (result.data.status === "success") {
      const order = await OrderModel.findOne({ paymentReference: reference });
      console.log(order);
      if (!order) return res.status(404).send("Order not found");

      order.status = "COMPLETED";
      await order.save();
      return res.status(200).json({ message: "Payment successful" });
    }
    return res.status(400).json({ message: "Payment not successful" });
  }

  // NEW METHODS FOR ARTISAN RESPONSE

  acceptOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { estimatedCompletionDate } = req.body;
      const artisanId = req.currentUser!.id;

      const completionDate = estimatedCompletionDate
        ? new Date(estimatedCompletionDate)
        : undefined;

      await this.orderService.acceptOrder(orderId, artisanId, completionDate);

      res.status(200).json({
        message: "Order accepted successfully",
        orderId,
        estimatedCompletionDate: completionDate,
      });
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Error accepting order:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  rejectOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { reason, note } = req.body;
      const artisanId = req.currentUser!.id;

      //if (!reason || !Object.values(RejectionReason).includes(reason)) {
      //  res.status(400).json({
      //    error: "Valid rejection reason is required",
      //    validReasons: Object.values(RejectionReason),
      //  });
      //}
      await this.orderService.rejectOrder(orderId, artisanId, reason, note);

      res.status(200).json({
        message: "Order rejected successfully",
        orderId,
        reason,
        note,
      });
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Error rejecting order:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  startWork = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const artisanId = req.currentUser!.id;

      await this.orderService.startWork(orderId, artisanId);

      res.status(200).json({
        message: "Work started on order",
        orderId,
      });
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Error starting work:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  getArtisanOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const artisanId = req.currentUser!.id;
      const { status } = req.query;

      const orders = await this.orderService.getArtisanOrders(
        artisanId,
        status as string
      );

      res.status(200).json({
        artisanId,
        totalOrders: orders.length,
        status: status || "all",
        orders,
      });
    } catch (error: any) {
      console.error("Error fetching artisan orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getClientOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = req.currentUser!.id;
      const { status } = req.query;

      const orders = await this.orderService.getClientOrders(
        clientId,
        status as string
      );

      res.status(200).json({
        clientId,
        totalOrders: orders.length,
        status: status || "all",
        orders,
      });
    } catch (error: any) {
      console.error("Error fetching client orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getPendingOrdersForArtisan = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const artisanId = req.currentUser!.id;

      const orders = await this.orderService.getPendingOrdersForArtisan(
        artisanId
      );

      res.status(200).json({
        artisanId,
        pendingOrders: orders.length,
        orders: orders.map((order) => ({
          ...order,
          timeLeft:
            order.artisanResponseDeadline.getTime() - new Date().getTime(),
          timeLeftHours: Math.max(
            0,
            Math.ceil(
              (order.artisanResponseDeadline.getTime() - new Date().getTime()) /
                (1000 * 60 * 60)
            )
          ),
        })),
      });
    } catch (error: any) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  async testing(req: Request, res: Response): Promise<void> {
    const { serviceId, clientId, userId } = req.params;
    const result = await this.orderService.testing(serviceId, clientId, userId);
    res.status(200).json(result);
  }
}
