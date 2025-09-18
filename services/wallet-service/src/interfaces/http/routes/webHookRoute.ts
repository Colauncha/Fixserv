import { Router } from "express";
import express from "express";
import { WalletController } from "../../../interfaces/controller/walletController";
import { WalletService } from "../../../application/services/walletService";

const webhookRouter = Router();

// Webhook routes - NO express.json() middleware applied here
//webhookRouter.post(
//  "/paystack/webhook",
//  express.raw({ type: "application/json" }), // Only //use raw middleware
//  WalletController.handlePaystackWebhook
//);

webhookRouter.get("/paystack/webhook/test", (req, res) => {
  console.log("🧪 Webhook test endpoint called");
  res.status(200).json({
    success: true,
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
  });
});

// Add this enhanced logging to see if Paystack is calling your webhook

// Enhanced webhook handler with better logging
webhookRouter.post(
  "/paystack/webhook",
  express.raw({ type: "application/json" }),
  async (req: any, res) => {
    // Log EVERY webhook call with timestamp
    const timestamp = new Date().toISOString();
    console.log(`\n=== WEBHOOK RECEIVED AT ${timestamp} ===`);

    // Check if this looks like a real Paystack webhook
    const isRealPaystack =
      req.headers["user-agent"]?.includes("Paystack") ||
      req.headers["x-paystack-signature"]?.length > 10;

    console.log(
      `🔍 Source: ${isRealPaystack ? "REAL PAYSTACK" : "TEST/MANUAL"}`
    );
    console.log(`🌐 User-Agent: ${req.headers["user-agent"]}`);
    console.log(
      `🔑 Signature Length: ${req.headers["x-paystack-signature"]?.length || 0}`
    );
    console.log(`📡 IP: ${req.ip}, X-Real-IP: ${req.headers["x-real-ip"]}`);

    // Continue with your existing webhook logic...
    // [Your existing webhook handler code here]

    console.log(`=== WEBHOOK PROCESSED AT ${new Date().toISOString()} ===\n`);
  }
);

// Test endpoint to simulate a real payment flow
webhookRouter.post("/test-payment-flow", async (req, res) => {
  try {
    const { email, amount } = req.body;

    console.log(`🧪 Testing payment flow for ${email} with amount ${amount}`);

    // Step 1: Initialize payment
    const paymentResult = await WalletService.initiateTopup(amount, email);
    console.log(`💳 Payment URL generated: ${paymentResult}`);

    res.json({
      success: true,
      message:
        "Payment initialized. Complete payment and check logs for webhook calls.",
      paymentUrl: paymentResult,
      instructions: [
        "1. Click the payment URL",
        "2. Complete payment with test card: 4084084084084081",
        "3. Check server logs for automatic webhook processing",
        "4. Verify wallet balance was updated automatically",
      ],
      testCards: {
        success: "4084084084084081",
        failed: "4111111111111112",
        insufficientFunds: "4056000000000008",
      },
    });
  } catch (error: any) {
    console.error("Test payment flow error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook delivery status checker
webhookRouter.get("/webhook-status/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    // Check if we received webhook for this reference
    // You might want to store webhook receipts in a temporary cache/database

    res.json({
      reference,
      message: "Check server logs for webhook delivery for this reference",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { webhookRouter };
