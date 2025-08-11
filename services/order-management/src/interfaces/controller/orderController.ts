import express, { Request, Response } from "express";
import crypto from "crypto";
import { OrderService } from "../../application/services/orderService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { PaystackClient } from "../../infrastructure/reuseableWrapper/paystackClient";
import { OrderModel } from "../../infrastructure/persistence/models/orderModel";

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
}
