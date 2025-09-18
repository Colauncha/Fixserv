import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { WalletService } from "../../application/services/walletService";
import { WalletModel } from "src/infrastructure/persistence/models/walletModel";
import { ReferralService } from "src/application/services/referralService";

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
  /*
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
        // process.env.NODE_ENV === "development" ||
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
  */
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
  /*
  // Handle successful charge events
  private static async handleChargeSuccess(chargeData: any) {
    try {
      const { reference, amount, status, customer, channel, gateway_response } =
        chargeData;

      console.log(`🎉 Processing successful charge:`, {
        reference,
        amount: amount / 100, // Convert from kobo to naira
        email: customer.email,
        channel,
        gateway_response,
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
    */

  /*
  // Handle failed charge events
  private static async handleChargeFailed(chargeData: any, requestId?: string) {
    try {
      const { reference, gateway_response, customer, amount } = chargeData;

      console.log(
        `Processing failed charge ${requestId ? `[${requestId}]` : ""}:`,
        {
          reference,
          reason: gateway_response,
          email: customer.email,
          amount: amount / 100,
        }
      );

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
    */

  // Health check endpoint for webhook
  static async webhookHealthCheck(req: any, res: any) {
    res.status(200).json({
      success: true,
      message: "Webhook endpoint is healthy",
      timestamp: new Date().toISOString(),
    });
  }

  // Handle dispute creation
  static async handleDisputeCreated(
    disputeData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { reference, amount, reason, customer, status } = disputeData;

      console.log(`Dispute created ${requestId ? `[${requestId}]` : ""}:`, {
        reference,
        amount: amount / 100,
        reason,
        email: customer?.email,
        status,
      });

      // Optional: Freeze related funds or mark transaction as disputed
      try {
        // await DisputeService.handleNewDispute({
        //   reference,
        //   amount: amount / 100,
        //   reason,
        //   customerEmail: customer?.email,
        //   status
        // });
        console.log(`Dispute handling initiated for ${reference}`);
      } catch (disputeError: any) {
        console.error("Failed to handle dispute:", disputeError);
      }

      // Optional: Notify admin about dispute
      try {
        // await NotificationService.notifyAdminOfDispute({
        //   reference,
        //   amount: amount / 100,
        //   reason,
        //   customerEmail: customer?.email
        // });
        console.log(`Admin notified about dispute: ${reference}`);
      } catch (notifError: any) {
        console.error("Failed to notify admin of dispute:", notifError);
      }
    } catch (error: any) {
      console.error(
        `Error processing dispute creation ${
          requestId ? `[${requestId}]` : ""
        } for ${disputeData.reference}:`,
        error
      );
    }
  }

  // Handle dispute resolution
  static async handleDisputeResolved(
    disputeData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { reference, status, resolution } = disputeData;

      console.log(`Dispute resolved ${requestId ? `[${requestId}]` : ""}:`, {
        reference,
        status,
        resolution,
      });

      // Optional: Update dispute status and unfreeze funds if needed
      try {
        // await DisputeService.handleDisputeResolution({
        //   reference,
        //   status,
        //   resolution
        // });
        console.log(`Dispute resolution processed for ${reference}`);
      } catch (disputeError: any) {
        console.error("Failed to process dispute resolution:", disputeError);
      }
    } catch (error: any) {
      console.error(
        `Error processing dispute resolution ${
          requestId ? `[${requestId}]` : ""
        } for ${disputeData.reference}:`,
        error
      );
    }
  }
  /////////////////////////////////////////////////////////////////////
  /*
  // Handle successful transfer (withdrawal/payout)
  static async handleTransferSuccess(
    transferData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { reference, amount, recipient, status } = transferData;

      console.log(`Transfer completed ${requestId ? `[${requestId}]` : ""}:`, {
        reference,
        amount: amount / 100,
        recipient: recipient.name || recipient.account_name,
        bank: recipient.bank_name,
        status,
      });

      // Optional: Update withdrawal status to completed
      try {
        // await WithdrawalService.markTransferComplete({
        //   reference,
        //   amount: amount / 100,
        //   recipient,
        //   completedAt: new Date()
        // });
        console.log(`Withdrawal marked as completed: ${reference}`);
      } catch (withdrawalError: any) {
        console.error(
          "Failed to mark withdrawal as completed:",
          withdrawalError
        );
      }

      // Optional: Send success notification
      try {
        // await NotificationService.sendWithdrawalSuccessNotification(
        //   recipient.email || recipient.account_name,
        //   amount / 100,
        //   reference
        // );
        console.log(`Withdrawal success notification queued for ${reference}`);
      } catch (notifError: any) {
        console.error(
          "Failed to send withdrawal success notification:",
          notifError
        );
      }
    } catch (error: any) {
      console.error(
        `Error processing transfer success ${
          requestId ? `[${requestId}]` : ""
        } for ${transferData.reference}:`,
        error
      );
    }
  }
    */

  /*
  // Handle failed transfer
  static async handleTransferFailed(
    transferData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { reference, failure_reason, amount } = transferData;

      console.log(`Transfer failed ${requestId ? `[${requestId}]` : ""}:`, {
        reference,
        reason: failure_reason,
        amount: amount / 100,
      });

      // Optional: Refund the amount back to user's wallet
      try {
        // await WithdrawalService.refundFailedTransfer({
        //   reference,
        //   amount: amount / 100,
        //   reason: failure_reason
        // });
        console.log(`Failed transfer refunded to wallet: ${reference}`);
      } catch (refundError: any) {
        console.error("Failed to refund failed transfer:", refundError);
      }

      // Optional: Send failure notification
      try {
        // await NotificationService.sendWithdrawalFailedNotification(
        //   transferData.recipient?.email,
        //   amount / 100,
        //   failure_reason,
        //   reference
        // );
        console.log(`Withdrawal failure notification queued for ${reference}`);
      } catch (notifError: any) {
        console.error(
          "Failed to send withdrawal failure notification:",
          notifError
        );
      }
    } catch (error: any) {
      console.error(
        `Error processing transfer failure ${
          requestId ? `[${requestId}]` : ""
        } for ${transferData.reference}:`,
        error
      );
    }
  }
*/
  /*
  // Handle transfer reversal
  static async handleTransferReversed(
    transferData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { reference, amount } = transferData;

      console.log(`Transfer reversed ${requestId ? `[${requestId}]` : ""}:`, {
        reference,
        amount: amount / 100,
      });

      // Optional: Credit the amount back to user's wallet
      try {
        // await WithdrawalService.handleTransferReversal({
        //   reference,
        //   amount: amount / 100,
        //   reversedAt: new Date()
        // });
        console.log(`Transfer reversal credited to wallet: ${reference}`);
      } catch (reversalError: any) {
        console.error("Failed to handle transfer reversal:", reversalError);
      }
    } catch (error: any) {
      console.error(
        `Error processing transfer reversal ${
          requestId ? `[${requestId}]` : ""
        } for ${transferData.reference}:`,
        error
      );
    }
  }
    */

  // Handle refund events
  static async handleRefundProcessed(
    refundData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { transaction, amount, status } = refundData;
      const reference = transaction.reference;

      console.log(`Refund processed ${requestId ? `[${requestId}]` : ""}:`, {
        originalReference: reference,
        refundAmount: amount / 100,
        status,
      });

      // Optional: Update order status or credit wallet if applicable
      try {
        // await RefundService.handleProcessedRefund({
        //   originalReference: reference,
        //   refundAmount: amount / 100,
        //   processedAt: new Date()
        // });
        console.log(`Refund processing completed for ${reference}`);
      } catch (refundError: any) {
        console.error("Failed to handle processed refund:", refundError);
      }
    } catch (error: any) {
      console.error(
        `Error processing refund ${requestId ? `[${requestId}]` : ""} for ${
          refundData.transaction?.reference
        }:`,
        error
      );
    }
  }

  // Handle subscription events
  static async handleSubscriptionCreated(
    subscriptionData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { subscription_code, customer, plan } = subscriptionData;

      console.log(
        `Subscription created ${requestId ? `[${requestId}]` : ""}:`,
        {
          subscription_code,
          customer: customer.email,
          plan: plan.name,
        }
      );

      // Optional: Activate subscription in your system
      try {
        // await SubscriptionService.activateSubscription({
        //   subscriptionCode: subscription_code,
        //   customerEmail: customer.email,
        //   planName: plan.name,
        //   amount: plan.amount / 100
        // });
        console.log(`Subscription activated: ${subscription_code}`);
      } catch (subError: any) {
        console.error("Failed to activate subscription:", subError);
      }
    } catch (error: any) {
      console.error(
        `Error processing subscription creation ${
          requestId ? `[${requestId}]` : ""
        } for ${subscriptionData.subscription_code}:`,
        error
      );
    }
  }

  // Handle subscription disabled
  static async handleSubscriptionDisabled(
    subscriptionData: any,
    requestId?: string
  ): Promise<void> {
    try {
      const { subscription_code, customer } = subscriptionData;

      console.log(
        `Subscription disabled ${requestId ? `[${requestId}]` : ""}:`,
        {
          subscription_code,
          customer: customer?.email,
        }
      );

      // Optional: Disable subscription in your system
      try {
        // await SubscriptionService.disableSubscription({
        //   subscriptionCode: subscription_code,
        //   customerEmail: customer?.email,
        //   disabledAt: new Date()
        // });
        console.log(`Subscription disabled: ${subscription_code}`);
      } catch (subError: any) {
        console.error("Failed to disable subscription:", subError);
      }
    } catch (error: any) {
      console.error(
        `Error processing subscription disabling ${
          requestId ? `[${requestId}]` : ""
        } for ${subscriptionData.subscription_code}:`,
        error
      );
    }
  }

  // Health check for webhook
  //static async webhookHealthCheck(req: any, res: any) {
  //  res.status(200).json({
  //    success: true,
  //    message: "Webhook endpoint is healthy",
  //    timestamp: new Date().toISOString(),
  //    environment: process.env.NODE_ENV || 'development'
  //  });
  //}

  // Webhook statistics
  static async getWebhookStats(req: any, res: any) {
    try {
      // Optional: Get webhook processing statistics
      res.status(200).json({
        success: true,
        message: "Webhook statistics retrieved",
        data: {
          // Add actual stats from your logging/monitoring system
          totalProcessed: 0,
          successfulPayments: 0,
          failedPayments: 0,
          disputes: 0,
          transfers: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve webhook statistics",
        error: error.message,
      });
    }
  }
  /////////////////////////////////////////////////////////////

  /**
   * Get list of banks for withdrawal
   */
  static async getBanksListHandler(req: any, res: any) {
    try {
      const banks = await WalletService.getBanksList();

      res.status(200).json({
        success: true,
        message: "Banks list retrieved successfully",
        data: banks,
      });
    } catch (error: any) {
      console.error("Get banks list error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch banks list",
      });
    }
  }

  /**
   * Resolve account details
   */
  static async resolveAccountHandler(req: any, res: any) {
    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          success: false,
          message: "Account number and bank code are required",
        });
      }

      const accountDetails = await WalletService.resolveAccountDetails(
        accountNumber,
        bankCode
      );

      res.status(200).json({
        success: true,
        message: "Account details resolved successfully",
        data: accountDetails,
      });
    } catch (error: any) {
      console.error("Resolve account error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to resolve account details",
      });
    }
  }

  /**
   * Initiate withdrawal
   */
  static async initiateWithdrawalHandler(req: any, res: any) {
    try {
      const { userId, amount, accountNumber, bankCode, pin } = req.body;

      // Validation
      if (!userId || !amount || !accountNumber || !bankCode) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: userId, amount, accountNumber, bankCode",
        });
      }

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }

      // Additional validation for account number format
      if (!/^\d{10}$/.test(accountNumber)) {
        return res.status(400).json({
          success: false,
          message: "Account number must be 10 digits",
        });
      }

      const result = await WalletService.initiateWithdrawal(
        userId,
        amount,
        accountNumber,
        bankCode,
        pin
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Initiate withdrawal error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to initiate withdrawal",
      });
    }
  }

  /**
   * Process withdrawal (admin/automated)
   */
  static async processWithdrawalHandler(req: any, res: any) {
    try {
      const { withdrawalId } = req.params;

      if (!withdrawalId) {
        return res.status(400).json({
          success: false,
          message: "Withdrawal ID is required",
        });
      }

      const result = await WalletService.processWithdrawal(withdrawalId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error("Process withdrawal error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process withdrawal",
      });
    }
  }

  /**
   * Get withdrawal history for a user
   */
  static async getWithdrawalHistoryHandler(req: any, res: any) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const result = await WalletService.getWithdrawalHistory(
        userId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: "Withdrawal history retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Get withdrawal history error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch withdrawal history",
      });
    }
  }

  /**
   * Get pending withdrawals (admin endpoint)
   */
  static async getPendingWithdrawalsHandler(req: any, res: any) {
    try {
      const pendingWithdrawals = await WalletService.getPendingWithdrawals();

      res.status(200).json({
        success: true,
        message: "Pending withdrawals retrieved successfully",
        data: {
          withdrawals: pendingWithdrawals,
          count: pendingWithdrawals.length,
        },
      });
    } catch (error: any) {
      console.error("Get pending withdrawals error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch pending withdrawals",
      });
    }
  }

  /**
   * Cancel withdrawal
   */
  static async cancelWithdrawalHandler(req: any, res: any) {
    try {
      const { userId, withdrawalId } = req.params;

      if (!userId || !withdrawalId) {
        return res.status(400).json({
          success: false,
          message: "User ID and Withdrawal ID are required",
        });
      }

      const result = await WalletService.cancelWithdrawal(userId, withdrawalId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          refundedAmount: result.refundedAmount,
        },
      });
    } catch (error: any) {
      console.error("Cancel withdrawal error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel withdrawal",
      });
    }
  }

  /**
   * Enhanced webhook handler to include transfer events
   */
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
          console.log("✅ Body already parsed as object");
          webhookData = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          console.log("📦 Body is buffer, parsing...");
          const bodyString = req.body.toString();
          console.log("Body as string:", bodyString);
          webhookData = JSON.parse(bodyString);
        } else if (typeof req.body === "string") {
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
        // process.env.NODE_ENV === "development" ||
        signature === "hjjj" || signature === "test-signature";

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

        // NEW: Withdrawal-related events
        case "transfer.success":
          await WalletController.handleTransferSuccess(webhookData.data);
          break;

        case "transfer.failed":
          await WalletController.handleTransferFailed(webhookData.data);
          break;

        case "transfer.reversed":
          await WalletController.handleTransferReversed(webhookData.data);
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

  /**
   * Handle successful transfer (withdrawal completed)
   */
  private static async handleTransferSuccess(transferData: any) {
    try {
      const { reference, amount, recipient, status } = transferData;

      console.log(`🎉 Processing successful transfer:`, {
        reference,
        amount: amount / 100, // Convert from kobo to naira
        recipient: recipient?.name || recipient?.account_name,
        bank: recipient?.bank_name,
        status,
      });

      // Mark withdrawal as completed
      await WalletService.handleWithdrawalSuccess(reference);

      console.log("✅ Withdrawal marked as completed:", reference);
    } catch (error: any) {
      console.error(
        `❌ Error processing transfer success for ${transferData.reference}:`,
        error
      );
    }
  }

  /**
   * Handle failed transfer (withdrawal failed)
   */
  private static async handleTransferFailed(transferData: any) {
    try {
      const { reference, failure_reason, amount } = transferData;

      console.log(`❌ Processing failed transfer:`, {
        reference,
        reason: failure_reason,
        amount: amount / 100,
      });

      // Handle withdrawal failure and refund user
      await WalletService.handleWithdrawalFailure(
        reference,
        failure_reason || "Transfer failed"
      );

      console.log("✅ Failed withdrawal refunded:", reference);
    } catch (error: any) {
      console.error(
        `❌ Error processing transfer failure for ${transferData.reference}:`,
        error
      );
    }
  }

  /**
   * Handle transfer reversal
   */
  private static async handleTransferReversed(transferData: any) {
    try {
      const { reference, amount } = transferData;

      console.log(`🔄 Processing transfer reversal:`, {
        reference,
        amount: amount / 100,
      });

      // Handle as a withdrawal failure (refund the user)
      await WalletService.handleWithdrawalFailure(
        reference,
        "Transfer was reversed by the bank"
      );

      console.log("✅ Transfer reversal processed:", reference);
    } catch (error: any) {
      console.error(
        `❌ Error processing transfer reversal for ${transferData.reference}:`,
        error
      );
    }
  }

  // Keep existing methods: handleChargeSuccess, handleChargeFailed, etc.
  private static async handleChargeSuccess(chargeData: any) {
    try {
      const { reference, amount, status, customer, channel, gateway_response } =
        chargeData;

      console.log(`🎉 Processing successful charge:`, {
        reference,
        amount: amount / 100,
        email: customer.email,
        channel,
        gateway_response,
        status,
      });

      if (status !== "success") {
        console.warn(`⚠️ Charge status is '${status}', expected 'success'`);
        return;
      }

      const result = await WalletService.verifyTopup(reference);

      console.log("✅ Automatic wallet topup completed:", {
        reference,
        message: result.message,
        newBalance: result.wallet?.balance,
      });
    } catch (error: any) {
      console.error(
        `❌ Error processing charge success for ${chargeData.reference}:`,
        error
      );
      throw error;
    }
  }

  private static async handleChargeFailed(chargeData: any) {
    try {
      const { reference, gateway_response, customer, amount } = chargeData;

      console.log(`❌ Processing failed charge:`, {
        reference,
        reason: gateway_response,
        email: customer.email,
        amount: amount / 100,
      });

      // Optional: Send notification about failed payment
    } catch (error: any) {
      console.error(
        `Error processing charge failure for ${chargeData.reference}:`,
        error
      );
    }
  }

  ///////////////////////////////////////////////////////////////////
  /**
   * Handle new user signup with referral processing
   * Called by your user management service after user creation
   */
  static async handleNewUserSignupHandler(req: any, res: any) {
    try {
      const { userId, userType, referralCode } = req.body;

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, userType",
        });
      }

      if (!["CLIENT", "ARTISAN"].includes(userType)) {
        return res.status(400).json({
          success: false,
          message: "userType must be either CLIENT or ARTISAN",
        });
      }

      // Validate referral code format if provided
      if (referralCode && !ReferralService.validateReferralCode(referralCode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code format",
        });
      }

      const result = await ReferralService.handleUserSignup(
        userId,
        userType,
        referralCode
      );

      res.status(201).json({
        success: true,
        message: "User signup processed successfully",
        data: {
          fixpointsBalance: result.fixpointsBalance.points,
          referralCode: result.referralCode.code,
          referralReward: result.referrerReward
            ? {
                pointsAwarded: result.referrerReward.pointsAwarded,
                status: result.referrerReward.status,
              }
            : null,
        },
      });
    } catch (error: any) {
      console.error("Handle new user signup error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process user signup",
      });
    }
  }

  /**
   * Handle artisan verification
   */
  static async handleArtisanVerificationHandler(req: any, res: any) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }

      await ReferralService.handleArtisanVerification(userId);

      res.status(200).json({
        success: true,
        message: "Artisan verification bonus awarded successfully",
      });
    } catch (error: any) {
      console.error("Handle artisan verification error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process artisan verification",
      });
    }
  }

  /**
   * Get user's fixpoints balance
   */
  static async getFixpointsBalanceHandler(req: any, res: any) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }

      const balance = await ReferralService.getFixpointsBalance(userId);

      res.status(200).json({
        success: true,
        message: "Fixpoints balance retrieved successfully",
        data: balance,
      });
    } catch (error: any) {
      console.error("Get fixpoints balance error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get fixpoints balance",
      });
    }
  }

  /**
   * Redeem fixpoints for wallet credit
   */
  static async redeemFixpointsHandler(req: any, res: any) {
    try {
      const { userId, points } = req.body;

      if (!userId || !points) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, points",
        });
      }

      if (typeof points !== "number" || points <= 0) {
        return res.status(400).json({
          success: false,
          message: "Points must be a positive number",
        });
      }

      const result = await ReferralService.redeemFixpoints(userId, points);

      res.status(200).json({
        success: true,
        message: `Successfully redeemed ${points} fixpoints for ₦${result.nairaAmount}`,
        data: result,
      });
    } catch (error: any) {
      console.error("Redeem fixpoints error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to redeem fixpoints",
      });
    }
  }

  /**
   * Get user's referral information
   */
  static async getReferralInfoHandler(req: any, res: any) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }

      const referralInfo = await ReferralService.getReferralInfo(userId);

      res.status(200).json({
        success: true,
        message: "Referral information retrieved successfully",
        data: referralInfo,
      });
    } catch (error: any) {
      console.error("Get referral info error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get referral information",
      });
    }
  }

  /**
   * Get fixpoints transaction history
   */
  static async getFixpointsTransactionHistoryHandler(req: any, res: any) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "UserId is required",
        });
      }

      const history = await ReferralService.getTransactionHistory(
        userId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: "Fixpoints transaction history retrieved successfully",
        data: history,
      });
    } catch (error: any) {
      console.error("Get fixpoints transaction history error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get transaction history",
      });
    }
  }

  /**
   * Validate referral code
   */
  static async validateReferralCodeHandler(req: any, res: any) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: "Referral code is required",
        });
      }

      // Basic format validation
      if (!ReferralService.validateReferralCode(code)) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code format",
          isValid: false,
        });
      }

      // Check if code exists and is active
      const ReferralCodeModel =
        require("../../infrastructure/persistence/models/referralModels").ReferralCodeModel;
      const referralCode = await ReferralCodeModel.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });

      if (!referralCode) {
        return res.status(404).json({
          success: false,
          message: "Referral code not found or inactive",
          isValid: false,
        });
      }

      res.status(200).json({
        success: true,
        message: "Valid referral code",
        isValid: true,
        data: {
          code: referralCode.code,
          userType: referralCode.userType,
          usageCount: referralCode.usageCount,
        },
      });
    } catch (error: any) {
      console.error("Validate referral code error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate referral code",
        isValid: false,
      });
    }
  }

  /**
   * Get referral analytics (admin endpoint)
   */
  static async getReferralAnalyticsHandler(req: any, res: any) {
    try {
      const analytics = await ReferralService.getReferralAnalytics();

      res.status(200).json({
        success: true,
        message: "Referral analytics retrieved successfully",
        data: analytics,
      });
    } catch (error: any) {
      console.error("Get referral analytics error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get referral analytics",
      });
    }
  }
}

/////////////////////////////////////////////////////////////
