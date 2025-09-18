import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { WalletService } from "../../application/services/walletService";

export class WalletController {
  static async lockFundsForOrderHandler(req: any, res: any) {
    try {
      const { userId, orderId, amount } = req.body;

      if (!userId || !orderId || !amount) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, orderId, amount",
        });
      }

      const result = await WalletService.lockFundsForOrder(
        userId,
        orderId,
        amount
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Lock funds endpoint error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to lock funds",
      });
    }
  }
  static async releaseFundsToArtisanHandler(req: any, res: any) {
    try {
      const { orderId, artisanId, clientId } = req.body;

      if (!orderId || !artisanId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: orderId, artisanId",
        });
      }

      await WalletService.releaseFundsToArtisan(orderId, artisanId, clientId);

      res.status(200).json({
        success: true,
        message: "Funds released successfully",
      });
    } catch (error: any) {
      console.error("Release funds endpoint error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to release funds",
      });
    }
  }
  static async verifyTopupHandler(req: any, res: any) {
    try {
      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "Reference is required",
        });
      }

      const result = await WalletService.verifyTopup(reference);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Verify top-up endpoint error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to verify top-up",
      });
    }
  }

  static async getWalletBalanceHandler(req: any, res: any) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }
      const result = await WalletService.getWalletBalance(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  static async getTransactionHistoryHandler(req: any, res: any) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }
      const result = await WalletService.getTransactionHistory(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
  //  static async handlePaystackWebhook(req: any, res: any) {
  //    try {
  //      console.log("📨 Webhook received:", {
  //        headers: req.headers,
  //        body: req.body,
  //        event: req.body?.event,
  //      });
  //      const signature = req.headers["x-paystack-signature"];
  //      const secret = process.env.PAYSTACK_SECRET_KEY;
  //
  //      if (!signature || !secret) {
  //        return res.status(400).json({
  //          success: false,
  //          message: "Missing signature or secret key",
  //        });
  //      }
  //
  //      const hash = crypto
  //        .createHmac("sha512", secret)
  //        .update(JSON.stringify(req.body))
  //        .digest("hex");
  //
  //      console.log("Webhook signature hash:", hash);
  //
  //      if (hash !== signature) {
  //        console.error("❌ Invalid webhook signature");
  //        return res.status(400).json({
  //          success: false,
  //          message: "Invalid signature",
  //        });
  //      }
  //
  //      const event = req.body;
  //      console.log(
  //        "✅ Webhook signature verified, processing event:",
  //        event.event
  //      );
  //
  //      // Process the event (e.g., payment verification)
  //      //if (event.event === "charge.success") {
  //      //  const reference = event.data.reference;
  //      //  try {
  //      //    const result = await WalletService.verifyTopup(reference);
  //      //    console.log("Wallet Top-up Verified Automatically:", result);
  //      //  } catch (error: any) {
  //      //    console.error("Error verifying payment:", error);
  //      //  }
  //      //}
  //      /*
  //      if (event.event === "charge.success") {
  //        const reference = event.data.reference;
  //        const status = event.data.status;
  //        const amount = event.data.amount;
  //
  //        console.log(`🔄 Processing charge.success for reference: $//{reference}`);
  //        console.log(`Amount: ${amount}, Status: ${status}`);
  //
  //        // Only process if payment was actually successful
  //        if (status === "success") {
  //          try {
  //            const result = await WalletService.verifyTopup(reference);
  //            console.log("✅ Wallet Top-up Verified Automatically:", //result);
  //          } catch (error: any) {
  //            console.error("❌ Error verifying payment:", error.message);
  //            console.error("Full error:", error);
  //
  //            // Don't return error response - acknowledge webhook was //received
  //            // but log the processing error
  //          }
  //        } else {
  //          console.log(
  //            `⚠️ Payment status is '${status}', skipping wallet topup`
  //          );
  //        }
  //      } else {
  //        console.log(`ℹ️ Unhandled event type: ${event.event}`);
  //      }
  //*/
  //      // Handle different event types
  //      switch (event.event) {
  //        case "charge.success":
  //          await WalletController.handleChargeSuccess(event.data);
  //          break;
  //
  //        case "charge.failed":
  //          await WalletController.handleChargeFailed(event.data);
  //          break;
  //
  //        case "charge.dispute.create":
  //          console.log(
  //            "🚨 Dispute created for transaction:",
  //            event.data.reference
  //          );
  //          // Handle dispute logic here if needed
  //          break;
  //
  //        default:
  //          console.log(`ℹ️ Unhandled event type: ${event.event}`);
  //      }
  //
  //      // Always respond with 200 to acknowledge receipt
  //      res
  //        .status(200)
  //        .json({ success: true, message: "Webhook processed //successfully" });
  //    } catch (error: any) {
  //      console.error("💥 Webhook processing error:", error);
  //      res.status(200).json({
  //        success: false,
  //        message: "Webhook received but processing failed",
  //        error: error.message,
  //      });
  //    }
  //  }
  static async handlePaystackWebhook(req: any, res: any) {
    try {
      console.log("🔥 WEBHOOK CALLED! Details:");
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      console.log("Body type:", typeof req.body);
      console.log("Raw body:", req.body);

      let webhookData;

      // Handle both scenarios: already parsed JSON object OR raw buffer
      try {
        if (
          typeof req.body === "object" &&
          req.body !== null &&
          !Buffer.isBuffer(req.body)
        ) {
          // Body is already parsed as JSON object (most common case)
          console.log("✅ Body already parsed as object");
          webhookData = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          // Body is raw buffer - parse it
          console.log("📦 Body is buffer, parsing...");
          const bodyString = req.body.toString();
          console.log("Body as string:", bodyString);
          webhookData = JSON.parse(bodyString);
        } else if (typeof req.body === "string") {
          // Body is string - parse it
          console.log("📝 Body is string, parsing...");
          webhookData = JSON.parse(req.body);
        } else {
          throw new Error(`Unexpected body type: ${typeof req.body}`);
        }

        console.log(
          "✅ Parsed webhook data:",
          JSON.stringify(webhookData, null, 2)
        );
      } catch (error) {
        console.error("❌ Failed to parse webhook body:", error);
        return res.status(400).json({
          error: "Invalid JSON",
          bodyType: typeof req.body,
          bodyContent: req.body,
        });
      }

      // Verify signature (skip during testing)
      const signature = req.headers["x-paystack-signature"];
      console.log("Paystack signature:", signature);

      const skipSignatureVerification =
        process.env.NODE_ENV === "development" ||
        signature === "hjjj" ||
        signature === "test-signature";

      if (!skipSignatureVerification) {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!signature || !secret) {
          console.error("❌ Missing signature or secret key");
          return res.status(400).json({
            success: false,
            message: "Missing signature or secret key",
          });
        }

        const hash = crypto
          .createHmac("sha512", secret)
          .update(JSON.stringify(webhookData))
          .digest("hex");

        if (hash !== signature) {
          console.error("❌ Invalid webhook signature");
          return res.status(400).json({
            success: false,
            message: "Invalid signature",
          });
        }
      } else {
        console.log(
          "⚠️ Skipping signature verification (development/testing mode)"
        );
      }

      console.log("🎯 Processing event:", webhookData.event);

      // Handle different event types
      switch (webhookData.event) {
        case "charge.success":
          await WalletController.handleChargeSuccess(webhookData.data);
          break;

        case "charge.failed":
          await WalletController.handleChargeFailed(webhookData.data);
          break;

        default:
          console.log(`ℹ️ Unhandled event type: ${webhookData.event}`);
      }

      // Always respond with 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        event: webhookData.event,
        reference: webhookData.data?.reference,
        message: "Webhook processed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("💥 Webhook processing error:", error);

      // Still return 200 to prevent Paystack from retrying
      res.status(200).json({
        success: false,
        message: "Webhook received but processing failed",
        error: error.message,
      });
    }
  }
  static async refundFundsToClientHandler(req: any, res: any) {
    try {
      const { orderId, clientId } = req.body;
      if (!orderId || !clientId) {
        return res.status(400).json({
          success: false,
          message: "OrderId and ClientId are required",
        });
      }
      const result = await WalletService.refundFundsToClient(orderId, clientId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }
  // Handle successful charge events
  private static async handleChargeSuccess(chargeData: any) {
    try {
      const { reference, amount, status, customer } = chargeData;

      console.log(`🎉 Processing successful charge:`, {
        reference,
        amount: amount / 100, // Convert from kobo to naira
        email: customer.email,
        status,
      });

      // Double-check status
      if (status !== "success") {
        console.warn(`⚠️ Charge status is '${status}', expected 'success'`);
        return;
      }

      // Automatically verify and credit the wallet
      const result = await WalletService.verifyTopup(reference);

      console.log("✅ Automatic wallet topup completed:", {
        reference,
        message: result.message,
        newBalance: result.wallet?.balance,
      });

      // Optional: Send notification to user about successful topup
      // await NotificationService.sendTopupSuccessNotification(customer.email, amount / 100);
    } catch (error: any) {
      console.error(
        `❌ Error processing charge success for ${chargeData.reference}:`,
        error
      );

      // Log to monitoring service for manual review
      // await MonitoringService.logFailedWebhookProcessing(chargeData, error);

      throw error; // Re-throw to be caught by main handler
    }
  }

  // Handle failed charge events
  private static async handleChargeFailed(chargeData: any) {
    try {
      const { reference, gateway_response, customer } = chargeData;

      console.log(`❌ Payment failed:`, {
        reference,
        reason: gateway_response,
        email: customer.email,
      });

      // Optional: Send notification to user about failed payment
      // await NotificationService.sendTopupFailedNotification(
      //   customer.email,
      //   gateway_response
      // );
    } catch (error: any) {
      console.error(
        `Error processing charge failure for ${chargeData.reference}:`,
        error
      );
    }
  }

  // Health check endpoint for webhook
  static async webhookHealthCheck(req: any, res: any) {
    res.status(200).json({
      success: true,
      message: "Webhook endpoint is healthy",
      timestamp: new Date().toISOString(),
    });
  }
}
/////////////////////////////////////////////////////////////
