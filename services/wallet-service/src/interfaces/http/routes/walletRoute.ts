import { AuthMiddleware, ValidateRequest } from "@fixserv-colauncha/shared";
import { Router } from "express";
import { body } from "express-validator";
import express, { Request, Response } from "express";
import { WalletService } from "../../../application/services/walletService";
import { WalletController } from "../../../interfaces/controller/walletController";
const authMiddleware = new AuthMiddleware();
const validate = new ValidateRequest();
const router = Router();

router.post(
  "/top-up",
  [
    body("amount").isNumeric().withMessage("Amount is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validate.validateRequest,
  async (req: Request, res: Response) => {
    const { amount, email } = req.body;
    const paymentUrl = await WalletService.initiateTopup(amount, email);
    res.status(200).json({
      success: true,
      message: "Payment URL generated successfully",
      data: {
        paymentUrl,
        instructions:
          "Complete payment at the provided URL. Your wallet will be automatically credited upon successful payment.",
      },
    });
  }
);

//router.post("/lock-funds", async (req: Request, res: Response) => {
//  const { userId, orderId, amount } = req.body;
//  const data = await WalletService.lockFundsForOrder(userId, orderId, //amount);
//  res.status(200).json(data);
//});
//
//router.post("/release-funds", async (req: Request, res: Response) => {
//  const { orderId, artisanId } = req.body;
//  const data = await WalletService.releaseFundsToArtisan(orderId, //artisanId);
//  res.status(200).json(data);
//});

router.post("/lock-funds", WalletController.lockFundsForOrderHandler);

router.post("/release-funds", WalletController.releaseFundsToArtisanHandler);

router.post("/refund-funds", WalletController.refundFundsToClientHandler);

router.get("/top-up/verify/:reference", async (req: Request, res: Response) => {
  console.log(
    "⚠️ Manual verification endpoint called - should only be used for debugging"
  );
  const { reference } = req.params;
  const data = await WalletService.verifyTopup(reference);
  res.status(200).json(data);
});

router.get("/get-balance/:userId", WalletController.getWalletBalanceHandler);
router.get(
  "/get-transaction/:userId",
  WalletController.getTransactionHistoryHandler
);

//router.post(
//  "/paystack/webhook",
//  express.raw({ type: "application/json" }),
//  WalletController.handlePaystackWebhook
//);

// Health check for webhook
router.get("/webhook/health", WalletController.webhookHealthCheck);

//router.get("/paystack/webhook/test", (req, res) => {
//  console.log("🧪 Webhook test endpoint called");
//  res.status(200).json({
//    success: true,
//    message: "Webhook endpoint is accessible",
//    timestamp: new Date().toISOString(),
//    url: req.originalUrl,
//    method: req.method,
//  });
//});

//router.post(
//  "/paystack/webhook",
//  express.raw({ type: "application/json" }),
//  async (req: any, res: any) => {
//    console.log("🔥 WEBHOOK CALLED! Raw details:");
//    console.log("Headers:", JSON.stringify(req.//headers, null, 2));
//    console.log("Body type:", typeof req.body);
//    console.log("Body length:", req.body ? req.body.//length : 0);
//    console.log("Raw body:", req.body);
//
//    // Convert raw buffer to JSON
//    let webhookData;
//    try {
//      const bodyString = req.body.toString();
//      console.log("Body as string:", bodyString);
//      webhookData = JSON.parse(bodyString);
//      console.log("Parsed webhook data:", JSON.//stringify(webhookData, null, 2));
//    } catch (error) {
//      console.error("❌ Failed to parse webhook //body:", error);
//      return res.status(400).json({ error: "Invalid //JSON" });
//    }
//
//    // Check for Paystack signature
//    const signature = req.headers//["x-paystack-signature"];
//    console.log("Paystack signature:", signature);
//
//    if (!signature) {
//      console.log(
//        "⚠️ No Paystack signature found - this might //not be from Paystack"
//      );
//    }
//
//    // Log the event type
//    console.log("Event type:", webhookData.event);
//    console.log("Event data:", JSON.stringify//(webhookData.data, null, 2));
//
//    // Simple response to acknowledge receipt
//    res.status(200).json({
//      received: true,
//      event: webhookData.event,
//      timestamp: new Date().toISOString(),
//    });
//  }
//);
export { router as walletRouter };
