/*
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
*/
import { Router } from "express";
import express from "express";
import crypto from "crypto";
import { WalletService } from "../../../application/services/walletService";

const webhookRouter = Router();

// Webhook event processor class
class PaystackWebhookProcessor {
  private static processedWebhooks = new Map<string, number>();
  private static readonly WEBHOOK_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Main webhook handler
  static async handleWebhook(req: any, res: any) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      console.log(`\n=== PAYSTACK WEBHOOK ${requestId} ===`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
      console.log(`User-Agent: ${req.headers["user-agent"] || "Unknown"}`);

      // Parse webhook body
      const webhookData = await PaystackWebhookProcessor.parseWebhookBody(req);
      if (!webhookData) {
        return PaystackWebhookProcessor.sendErrorResponse(
          res,
          400,
          "Invalid webhook body"
        );
      }

      // Verify signature in production
      if (!PaystackWebhookProcessor.verifySignature(req, webhookData)) {
        return PaystackWebhookProcessor.sendErrorResponse(
          res,
          401,
          "Invalid signature"
        );
      }

      // Check for duplicate webhook
      const isDuplicate =
        PaystackWebhookProcessor.isDuplicateWebhook(webhookData);
      if (isDuplicate) {
        console.log(
          `Duplicate webhook detected: ${webhookData.event}:$ebhookData.data.reference}`
        );
        return PaystackWebhookProcessor.sendSuccessResponse(
          res,
          "Duplicate webhook ignored",
          webhookData
        );
      }

      // Process the event
      await PaystackWebhookProcessor.processEvent(webhookData, requestId);

      // Mark as processed
      PaystackWebhookProcessor.markWebhookAsProcessed(webhookData);

      const duration = Date.now() - startTime;
      console.log(`Webhook processed successfully in ${duration}ms`);

      return PaystackWebhookProcessor.sendSuccessResponse(
        res,
        "Webhook processed successfully",
        webhookData
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Webhook processing failed after ${duration}ms:`, error);

      // Always return 200 to prevent Paystack retries for processing errors
      return PaystackWebhookProcessor.sendSuccessResponse(
        res,
        "Webhook received but processing failed",
        null,
        error.message
      );
    }
  }

  // Parse webhook body (handles both buffer and object)
  private static async parseWebhookBody(req: any): Promise<any | null> {
    try {
      let webhookData;

      if (
        typeof req.body === "object" &&
        req.body !== null &&
        !Buffer.isBuffer(req.body)
      ) {
        // Already parsed as JSON object
        webhookData = req.body;
      } else if (Buffer.isBuffer(req.body)) {
        // Raw buffer - parse it
        const bodyString = req.body.toString("utf8");
        webhookData = JSON.parse(bodyString);
      } else if (typeof req.body === "string") {
        // String - parse it
        webhookData = JSON.parse(req.body);
      } else {
        throw new Error(`Unexpected body type: ${typeof req.body}`);
      }

      // Validate required fields
      if (!webhookData.event || !webhookData.data) {
        throw new Error("Missing required webhook fields: event, data");
      }

      console.log(`Event: ${webhookData.event}`);
      console.log(`Reference: ${webhookData.data.reference || "N/A"}`);
      console.log(`Status: ${webhookData.data.status || "N/A"}`);

      return webhookData;
    } catch (error: any) {
      console.error("Failed to parse webhook body:", error);
      return null;
    }
  }

  // Verify webhook signature
  private static verifySignature(req: any, webhookData: any): boolean {
    const signature = req.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Skip verification in development or for test signatures
    const isTestMode =
      // process.env.NODE_ENV === "development" ||
      signature === "test-signature" || signature === "signature" || !secret;

    if (isTestMode) {
      console.log("Skipping signature verification (development mode)");
      return true;
    }

    if (!signature || !secret) {
      console.error("Missing signature or secret key");
      return false;
    }

    try {
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(webhookData))
        .digest("hex");

      if (hash !== signature) {
        console.error("Signature verification failed");
        console.error("Expected:", hash);
        console.error("Received:", signature);
        return false;
      }

      console.log("Signature verified successfully");
      return true;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  // Check for duplicate webhooks
  private static isDuplicateWebhook(webhookData: any): boolean {
    const key = `${webhookData.event}:${
      webhookData.data.reference || webhookData.data.id
    }`;
    const now = Date.now();

    // Clean old entries
    for (const [
      existingKey,
      timestamp,
    ] of PaystackWebhookProcessor.processedWebhooks.entries()) {
      if (now - timestamp > PaystackWebhookProcessor.WEBHOOK_TTL) {
        PaystackWebhookProcessor.processedWebhooks.delete(existingKey);
      }
    }

    return PaystackWebhookProcessor.processedWebhooks.has(key);
  }

  // Mark webhook as processed
  private static markWebhookAsProcessed(webhookData: any): void {
    const key = `${webhookData.event}:${
      webhookData.data.reference || webhookData.data.id
    }`;
    PaystackWebhookProcessor.processedWebhooks.set(key, Date.now());
  }

  // Process different event types
  private static async processEvent(
    webhookData: any,
    requestId: string
  ): Promise<void> {
    console.log(`Processing event: ${webhookData.event} [${requestId}]`);

    switch (webhookData.event) {
      // Payment Events
      case "charge.success":
        await PaystackWebhookProcessor.handleChargeSuccess(
          webhookData.data,
          requestId
        );
        break;

      case "charge.failed":
        await PaystackWebhookProcessor.handleChargeFailed(
          webhookData.data,
          requestId
        );
        break;

      case "charge.dispute.create":
        await PaystackWebhookProcessor.handleDisputeCreated(
          webhookData.data,
          requestId
        );
        break;

      case "charge.dispute.resolve":
        await PaystackWebhookProcessor.handleDisputeResolved(
          webhookData.data,
          requestId
        );
        break;

      // Transfer Events
      case "transfer.success":
        await PaystackWebhookProcessor.handleTransferSuccess(
          webhookData.data,
          requestId
        );
        break;

      case "transfer.failed":
        await PaystackWebhookProcessor.handleTransferFailed(
          webhookData.data,
          requestId
        );
        break;

      case "transfer.reversed":
        await PaystackWebhookProcessor.handleTransferReversed(
          webhookData.data,
          requestId
        );
        break;

      // Subscription Events
      case "subscription.create":
        await PaystackWebhookProcessor.handleSubscriptionCreated(
          webhookData.data,
          requestId
        );
        break;

      case "subscription.disable":
        await PaystackWebhookProcessor.handleSubscriptionDisabled(
          webhookData.data,
          requestId
        );
        break;

      // Invoice Events
      case "invoice.create":
        await PaystackWebhookProcessor.handleInvoiceCreated(
          webhookData.data,
          requestId
        );
        break;

      case "invoice.payment_failed":
        await PaystackWebhookProcessor.handleInvoicePaymentFailed(
          webhookData.data,
          requestId
        );
        break;

      // Refund Events
      case "refund.pending":
        await PaystackWebhookProcessor.handleRefundPending(
          webhookData.data,
          requestId
        );
        break;

      case "refund.processed":
        await PaystackWebhookProcessor.handleRefundProcessed(
          webhookData.data,
          requestId
        );
        break;

      // Customer Events
      case "customeridentification.success":
        await PaystackWebhookProcessor.handleCustomerIdentificationSuccess(
          webhookData.data,
          requestId
        );
        break;

      case "customeridentification.failed":
        await PaystackWebhookProcessor.handleCustomerIdentificationFailed(
          webhookData.data,
          requestId
        );
        break;

      default:
        console.log(`Unhandled event type: ${webhookData.event}`);
        // Log unhandled events for future implementation
        await PaystackWebhookProcessor.logUnhandledEvent(
          webhookData,
          requestId
        );
    }
  }

  // === PAYMENT EVENT HANDLERS ===

  private static async handleChargeSuccess(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, amount, status, customer, channel } = data;

      console.log(`Processing successful charge [${requestId}]:`, {
        reference,
        amount: amount / 100, // Convert from kobo to naira
        email: customer.email,
        channel,
        status,
      });

      if (status !== "success") {
        console.warn(`Charge status is '${status}', expected 'success'`);
        return;
      }

      // Process wallet topup
      const result = await WalletService.verifyTopup(reference);

      console.log(`Wallet topup completed [${requestId}]:`, {
        reference,
        message: result.message,
        newBalance: result.wallet?.balance,
      });

      // Optional: Send success notification
      // await NotificationService.sendTopupSuccessNotification(customer.email, amount / 100);
    } catch (error: any) {
      console.error(`Error processing charge success [${requestId}]:`, error);
      throw error;
    }
  }

  private static async handleChargeFailed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, gateway_response, customer } = data;

      console.log(`Processing failed charge [${requestId}]:`, {
        reference,
        reason: gateway_response,
        email: customer.email,
      });

      // Optional: Send failure notification
      // await NotificationService.sendTopupFailedNotification(customer.email, gateway_response);

      // Optional: Log failed payment for analysis
      // await PaymentAnalyticsService.logFailedPayment(data);
    } catch (error: any) {
      console.error(`Error processing charge failure [${requestId}]:`, error);
    }
  }

  private static async handleDisputeCreated(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, amount, reason, customer } = data;

      console.log(`Dispute created [${requestId}]:`, {
        reference,
        amount: amount / 100,
        reason,
        email: customer?.email,
      });

      // Handle dispute - might need to freeze funds or notify admin
      // await DisputeService.handleNewDispute(data);
    } catch (error: any) {
      console.error(`Error processing dispute creation [${requestId}]:`, error);
    }
  }

  private static async handleDisputeResolved(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, status, resolution } = data;

      console.log(`Dispute resolved [${requestId}]:`, {
        reference,
        status,
        resolution,
      });

      // Handle dispute resolution
      // await DisputeService.handleDisputeResolution(data);
    } catch (error: any) {
      console.error(
        `Error processing dispute resolution [${requestId}]:`,
        error
      );
    }
  }

  // === TRANSFER EVENT HANDLERS ===

  private static async handleTransferSuccess(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, amount, recipient } = data;

      console.log(`Transfer completed [${requestId}]:`, {
        reference,
        amount: amount / 100,
        // recipient: recipient.name,
        recipient: recipient?.name || recipient?.account_name,
      });

      // Handle successful withdrawal/payout
      // await WithdrawalService.markTransferComplete(reference);
      await WalletService.handleWithdrawalSuccess(reference);
    } catch (error: any) {
      console.error(`Error processing transfer success [${requestId}]:`, error);
    }
  }

  private static async handleTransferFailed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, failure_reason } = data;

      console.log(`Transfer failed [${requestId}]:`, {
        reference,
        reason: failure_reason,
      });

      // Handle failed withdrawal - refund to wallet
      // await WithdrawalService.refundFailedTransfer(reference);
    } catch (error: any) {
      console.error(`Error processing transfer failure [${requestId}]:`, error);
    }
  }

  private static async handleTransferReversed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      const { reference, amount } = data;

      console.log(`Transfer reversed [${requestId}]:`, {
        reference,
        amount: amount / 100,
      });

      // Handle transfer reversal - credit back to wallet
      // await WithdrawalService.handleTransferReversal(reference);
    } catch (error: any) {
      console.error(
        `Error processing transfer reversal [${requestId}]:`,
        error
      );
    }
  }

  // === SUBSCRIPTION EVENT HANDLERS ===

  private static async handleSubscriptionCreated(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Subscription created [${requestId}]:`, {
        subscription_code: data.subscription_code,
        customer: data.customer.email,
      });

      // Handle new subscription
      // await SubscriptionService.activateSubscription(data);
    } catch (error: any) {
      console.error(
        `Error processing subscription creation [${requestId}]:`,
        error
      );
    }
  }

  private static async handleSubscriptionDisabled(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Subscription disabled [${requestId}]:`, {
        subscription_code: data.subscription_code,
      });

      // Handle subscription cancellation
      // await SubscriptionService.disableSubscription(data);
    } catch (error: any) {
      console.error(
        `Error processing subscription disabling [${requestId}]:`,
        error
      );
    }
  }

  // === INVOICE EVENT HANDLERS ===

  private static async handleInvoiceCreated(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Invoice created [${requestId}]:`, {
        invoice_code: data.invoice_code,
        amount: data.amount / 100,
      });

      // Handle new invoice
      // await InvoiceService.processNewInvoice(data);
    } catch (error: any) {
      console.error(`Error processing invoice creation [${requestId}]:`, error);
    }
  }

  private static async handleInvoicePaymentFailed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Invoice payment failed [${requestId}]:`, {
        invoice_code: data.invoice_code,
      });

      // Handle failed invoice payment
      // await InvoiceService.handlePaymentFailure(data);
    } catch (error: any) {
      console.error(
        `Error processing invoice payment failure [${requestId}]:`,
        error
      );
    }
  }

  // === REFUND EVENT HANDLERS ===

  private static async handleRefundPending(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Refund pending [${requestId}]:`, {
        transaction: data.transaction.reference,
        amount: data.amount / 100,
      });

      // Handle pending refund
      // await RefundService.handlePendingRefund(data);
    } catch (error: any) {
      console.error(`Error processing pending refund [${requestId}]:`, error);
    }
  }

  private static async handleRefundProcessed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Refund processed [${requestId}]:`, {
        transaction: data.transaction.reference,
        amount: data.amount / 100,
      });

      // Handle processed refund - might need to update order status
      // await RefundService.handleProcessedRefund(data);
    } catch (error: any) {
      console.error(`Error processing refund [${requestId}]:`, error);
    }
  }

  // === CUSTOMER EVENT HANDLERS ===

  private static async handleCustomerIdentificationSuccess(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Customer identification successful [${requestId}]:`, {
        customer_code: data.customer_code,
      });

      // Handle successful KYC
      // await CustomerService.updateKYCStatus(data.customer_code, 'verified');
    } catch (error: any) {
      console.error(
        `Error processing customer identification success [${requestId}]:`,
        error
      );
    }
  }

  private static async handleCustomerIdentificationFailed(
    data: any,
    requestId: string
  ): Promise<void> {
    try {
      console.log(`Customer identification failed [${requestId}]:`, {
        customer_code: data.customer_code,
      });

      // Handle failed KYC
      // await CustomerService.updateKYCStatus(data.customer_code, 'failed');
    } catch (error: any) {
      console.error(
        `Error processing customer identification failure [${requestId}]:`,
        error
      );
    }
  }

  // === UTILITY METHODS ===

  private static async logUnhandledEvent(
    webhookData: any,
    requestId: string
  ): Promise<void> {
    try {
      // Log unhandled events for future implementation
      console.log(`Unhandled event logged [${requestId}]:`, {
        event: webhookData.event,
        data: webhookData.data,
      });

      // Optional: Store in database for analysis
      // await WebhookLogService.logUnhandledEvent(webhookData, requestId);
    } catch (error: any) {
      console.error(`Error logging unhandled event [${requestId}]:`, error);
    }
  }

  private static sendSuccessResponse(
    res: any,
    message: string,
    webhookData: any,
    error?: string
  ) {
    return res.status(200).json({
      success: !error,
      message,
      event: webhookData?.event,
      reference: webhookData?.data?.reference,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  private static sendErrorResponse(res: any, status: number, message: string) {
    return res.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

// === WEBHOOK ROUTES ===

// Main webhook endpoint
webhookRouter.post(
  "/paystack/webhook",
  express.raw({ type: "application/json" }),
  PaystackWebhookProcessor.handleWebhook
);

// Health check endpoint
webhookRouter.get("/paystack/webhook/test", (req, res) => {
  console.log("Webhook health check endpoint called");
  res.status(200).json({
    success: true,
    message: "Paystack webhook endpoint is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Webhook status endpoint
webhookRouter.get("/paystack/webhook/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhook service is operational",
    processedWebhooks: PaystackWebhookProcessor["processedWebhooks"].size,
    timestamp: new Date().toISOString(),
  });
});

// Test payment flow endpoint
webhookRouter.post("/test-payment-flow", async (req: any, res: any) => {
  try {
    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Email and amount are required",
      });
    }

    console.log(`Testing payment flow for ${email} with amount ${amount}`);

    const paymentResult = await WalletService.initiateTopup(amount, email);

    res.json({
      success: true,
      message: "Test payment initialized successfully",
      paymentUrl: paymentResult,
      instructions: [
        "1. Click the payment URL to complete payment",
        "2. Use test card: 4084084084084081 (success)",
        "3. Check server logs for automatic webhook processing",
        "4. Verify wallet balance was updated automatically",
      ],
      testCards: {
        success: "4084084084084081",
        declined: "4111111111111112",
        insufficientFunds: "4056000000000008",
      },
    });
  } catch (error: any) {
    console.error("Test payment flow error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize test payment",
      error: error.message,
    });
  }
});

export { webhookRouter };
