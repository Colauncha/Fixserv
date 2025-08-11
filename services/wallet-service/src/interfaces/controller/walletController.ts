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
  static async handlePaystackWebhook(req: any, res: any) {
    try {
      const signature = req.headers["x-paystack-signature"];
      const secret = process.env.PAYSTACK_SECRET_KEY;

      if (!signature || !secret) {
        return res.status(400).json({
          success: false,
          message: "Missing signature or secret key",
        });
      }

      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      console.log("Webhook signature hash:", hash);

      if (hash !== signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid signature",
        });
      }

      const event = req.body;

      // Process the event (e.g., payment verification)
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        try {
          const result = await WalletService.verifyTopup(reference);
          console.log("Wallet Top-up Verified Automatically:", result);
        } catch (error: any) {
          console.error("Error verifying payment:", error);
        }
      }

      res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (error: any) {
      console.error("Paystack webhook error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process webhook",
        error: error.message,
      });
    }
  }
}
/////////////////////////////////////////////////////////////
