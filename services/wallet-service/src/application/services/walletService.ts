import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { PaystackService } from "../../infrastructure/payments/paystackService";
import {
  BadRequestError,
  RedisEventBus,
  publishActivity,
  ACTIVITY_ACTIONS,
} from "@fixserv-colauncha/shared";
import {
  WalletModel,
  WalletTransactionModel,
  WithdrawalRequestModel,
} from "../../infrastructure/persistence/models/walletModel";
import { UserManagementClient } from "../../infrastructure/reuseableWrapper/userManagementClient";
import { OrderClient } from "../../infrastructure/reuseableWrapper/orderManagementClient";
import {
  WalletTopUpEvent,
  WalletWithdrawalEvent,
} from "../../events/walletEvent";
import {
  PlatformWalletService,
  PLATFORM_FEE_PERCENT,
} from "./platformWalletService";

const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const verificationInProgress = new Map<string, Promise<any>>();

const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
export class WalletService {
  static async initiateTopup(amount: number, email: string) {
    try {
      const paymentData = await PaystackService.initializePayment(
        amount * 100,
        email,
      );

      return paymentData;
    } catch (error) {
      console.error("Error initiating topup:", error);
      throw new Error("Failed to initiate topup");
    }
  }
  /*
  static async verifyTopup(reference: string) {
    try {
      const result = await PaystackService.verifyPayment(reference);
      const { amount, customer, status } = result;
      if (status !== "success") {
        throw new BadRequestError(
          `Payment status is '${status}', expected 'success'`
        );
      }
      const email = customer.email;

      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new BadRequestError("User not found");
      }

      const wallet = await WalletModel.findOneAndUpdate(
        { userId: user.id },
        {
          $inc: { balance: amount / 100 },
          $push: {
            transactions: {
              type: "CREDIT",
              amount: amount / 100,
              reference,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );
      return {
        message: "Topup successful",
        wallet,
      };
    } catch (error) {
      console.error("Error verifying topup:", error);
      throw new Error("Failed to verify topup");
    }
  }
    */
  // Add this to prevent duplicate verification attempts

  static async verifyTopup(reference: string) {
    try {
      console.log(`Starting payment verification for reference: ${reference}`);

      // Check if verification is already in progress
      if (verificationInProgress.has(reference)) {
        console.log(
          `Verification already in progress for ${reference}, waiting...`,
        );
        return await verificationInProgress.get(reference);
      }

      // Create verification promise
      const verificationPromise = this.performVerification(reference);
      verificationInProgress.set(reference, verificationPromise);

      try {
        const result = await verificationPromise;
        return result;
      } finally {
        // Clean up after completion
        verificationInProgress.delete(reference);
      }
    } catch (error: any) {
      verificationInProgress.delete(reference);
      throw error;
    }
  }

  private static async performVerification(reference: string) {
    const result = await PaystackService.verifyPayment(reference);
    const { amount, customer, status } = result;

    console.log(`Payment verification result:`, {
      amount,
      status,
      email: customer.email,
    });

    if (status !== "success") {
      throw new BadRequestError(
        `Payment status is '${status}', expected 'success'`,
      );
    }

    const email = customer.email;

    // Enhanced user fetching with retry logic
    let user;
    try {
      user = await this.getUserByEmail(email);
      console.log(`User found:`, { id: user.id, email: user.email });
    } catch (userError: any) {
      console.error(
        `Failed to fetch user for email ${email}:`,
        userError.message,
      );

      // Provide more specific error messages
      if (userError.message.includes("Rate limited")) {
        throw new BadRequestError(
          "User service is temporarily unavailable due to rate limiting. Please try again in a few minutes.",
        );
      }

      if (userError.message.includes("User not found")) {
        throw new BadRequestError(`No user found with email: ${email}`);
      }

      throw new BadRequestError(
        "Unable to verify user information. Please try again later.",
      );
    }

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // Check if this payment has already been processed
    const existingWallet = await WalletModel.findOne({
      userId: user.id,
      "transactions.reference": reference,
    });

    if (existingWallet) {
      console.log(`Payment ${reference} already processed for user ${user.id}`);
      return {
        message: "Payment already processed",
        wallet: existingWallet,
      };
    }

    // Proceed with wallet update
    const wallet = await WalletModel.findOneAndUpdate(
      { userId: user.id },
      {
        $inc: { balance: amount / 100 },
        $push: {
          transactions: {
            type: "CREDIT",
            amount: amount / 100,
            reference,
            createdAt: new Date(),
          },
        },
        $setOnInsert: {
          userId: user.id,
          role: user.role,
          lockedBalance: 0,
          status: "ACTIVE",
          createdAt: new Date(),
        },
      },
      { new: true, upsert: true },
    );

    console.log(`✅ Wallet credited for user ${user.id}: ₦${amount / 100}`);

    // Publish WalletTopUpEvent AFTER successful wallet credit
    // This triggers notification in notification-service
    try {
      await eventBus.publish(
        "wallet_events",
        new WalletTopUpEvent({
          userId: user.id,
          email,
          amount: amount / 100,
          reference,
        }),
      );
      console.log(`✅ WalletTopUpEvent published for user ${user.id}`);
      await publishActivity({
        action: ACTIVITY_ACTIONS.WALLET_TOPUP,
        actorId: user.id,
        actorRole: wallet.role,
        service: "wallet-service",
        metadata: { amount: amount / 100, reference },
      });
    } catch (eventError: any) {
      // Non-fatal — wallet is credited, only notification fails
      console.error("Failed to publish WalletTopUpEvent:", eventError.message);
    }

    return {
      message: "Topup successful",
      wallet,
    };
  }

  /*
  static async getUserByEmail(email: string) {
    try {
      const response = await axios.get(
        `${process.env.USER_MANAGEMENT_URL}/users/email/${email}`
        //{
        //  headers: {
        //    Authorization: `Bearer ${process.env.JWT_SECRET}`,
        //  },
        //}
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user by email");
    }
  }
    */
  public static async getUserByEmail(email: string, maxRetries = 3) {
    // Check cache first
    const cached = userCache.get(email);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached user for ${email}`);
      return cached.user;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Fix the URL construction - make sure it matches your actual endpoint
        const url = `${process.env.USER_MANAGEMENT_URL}/users/email/${email}`;
        console.log(`Attempt ${attempt} - Fetching user from: ${url}`);

        const response = await axios.get(url, {
          timeout: 15000, // 15 second timeout
          headers: {
            "User-Agent": "WalletService/1.0",
            Accept: "application/json",
            "X-Internal-Service": "true",
            "X-Service-Name": "wallet-service",
            // If you have service-to-service authentication, add it here:
            // 'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
          },
        });

        // Cache the successful response
        userCache.set(email, {
          user: response.data,
          timestamp: Date.now(),
        });

        console.log(`Successfully fetched user for ${email}`);
        return response.data;
      } catch (error: any) {
        console.error(`Attempt ${attempt} - Error fetching user by email:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          email: email,
        });

        // Handle rate limiting specifically
        if (error.response?.status === 429) {
          if (attempt < maxRetries) {
            // Exponential backoff: 2^attempt * 2 seconds
            const delayMs = Math.pow(2, attempt) * 2000;
            console.log(`Rate limited. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            // Check if we have any cached data, even if expired
            const expiredCache = userCache.get(email);
            if (expiredCache) {
              console.log(
                `Using expired cache for ${email} due to persistent rate limiting`,
              );
              return expiredCache.user;
            }
            throw new Error(
              `Rate limited after ${maxRetries} attempts. Please try again later.`,
            );
          }
        }

        // Handle other HTTP errors
        if (error.response?.status === 404) {
          throw new Error("User not found");
        }

        if (error.response?.status >= 500) {
          if (attempt < maxRetries) {
            const delayMs = 1000 * attempt; // Linear backoff for server errors
            console.log(`Server error. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
        }

        // If we've exhausted retries or it's not a retryable error
        if (attempt === maxRetries) {
          throw new Error(
            "Failed to fetch user by email after multiple attempts",
          );
        }
      }
    }
  }

  static async lockFundsForOrder(
    clientId: string,
    orderId: string,
    amount: number,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log("Looking for wallet with userId:", clientId);
      const wallet = await WalletModel.findOne({ userId: clientId }).session(
        session,
      );
      if (!wallet) {
        throw new BadRequestError("Wallet not found for the user");
      }

      if (wallet.balance < amount) {
        throw new BadRequestError("Insufficient balance to lock funds");
      }

      // Check if there's already a locked transaction for this order
      const existingTransaction = await WalletTransactionModel.findOne({
        orderId,
        userId: clientId,
        status: "LOCKED",
      }).session(session);

      if (existingTransaction) {
        await session.commitTransaction();
        return { message: "Funds already locked", wallet };
      }

      // Create a separate wallet transaction record
      const walletTransaction = new WalletTransactionModel({
        orderId,
        userId: clientId,
        amount,
        status: "LOCKED",
      });

      //  const alreadyLocked = wallet.transactions.find(
      //    (tx) => tx.reference === orderId && tx.purpose === //"LOCKED_ESCROW"
      //  );
      //
      //  if (alreadyLocked) {
      //    return { message: "Funds already locked", wallet };
      //  }
      wallet.balance -= amount;
      wallet.lockedBalance += amount;

      // Record the transaction
      wallet.transactions.push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "LOCKED_ESCROW",
        amount,
        reference: orderId,
        description: `Lock funds for order ${orderId}`,
        createdAt: new Date(),
        status: "SUCCESS",
      });
      wallet.updatedAt = new Date();

      // Save both models within the transaction
      await wallet.save({ session });
      await walletTransaction.save({ session });

      await session.commitTransaction();

      console.log("Funds locked successfully for order:", orderId);
      return { message: "Funds locked successfully", wallet };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error locking funds:", error);
      throw new Error("Failed to lock funds");
    } finally {
      session.endSession();
    }
  }

  static async releaseFundsToArtisan(
    orderId: string,
    artisanId: string,
    clientId?: string,
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log(
        `Releasing funds for order ${orderId} to artisan ${artisanId}`,
      );

      const lockedTx = await WalletTransactionModel.findOne({
        orderId,
        status: "LOCKED",
      }).session(session);

      if (!lockedTx) {
        throw new BadRequestError("Locked transaction not found");
      }
      console.log(
        `Found locked transaction: ${lockedTx.amount} for user ${lockedTx.userId}`,
      );

      // Get the client wallet to reduce locked balance
      const clientWallet = await WalletModel.findOne({
        userId: lockedTx.userId, // Use userId from the locked transaction
      }).session(session);

      if (!clientWallet) {
        throw new BadRequestError("Client wallet not found");
      }

      // Get or create artisan wallet
      let artisanWallet = await WalletModel.findOne({
        userId: artisanId,
      }).session(session);

      if (!artisanWallet) {
        console.log("Artisan wallet not found, creating new wallet");
        artisanWallet = new WalletModel({
          userId: artisanId,
          role: "ARTISAN",
          balance: 0,
          lockedBalance: 0,
          status: "ACTIVE",
          transactions: [],
        });
      }

      // const amount = lockedTx.amount;
      const totalAmount = lockedTx.amount;
      const currentDate = new Date();

      // ── NEW: Calculate fee split ─────────────────────────────────────
      const platformFee = Number(
        (totalAmount * PLATFORM_FEE_PERCENT).toFixed(2),
      );
      const artisanAmount = Number((totalAmount - platformFee).toFixed(2));

      // Update client wallet - reduce locked balance
      clientWallet.lockedBalance -= totalAmount;
      clientWallet.updatedAt = currentDate;

      // Add completion transaction to client wallet
      clientWallet.transactions.push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "PAYMENT_COMPLETED",
        amount: totalAmount,
        reference: orderId,
        description: `Payment completed for order ${orderId} - funds released to artisan`,
        createdAt: currentDate,
        status: "SUCCESS",
      });

      // Update artisan wallet - add balance
      // artisanWallet.balance += amount;
      artisanWallet.balance += artisanAmount;
      artisanWallet.updatedAt = currentDate;

      // Add credit transaction to artisan wallet
      artisanWallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "PAYMENT_RECEIVED",
        // amount,
        amount: artisanAmount,
        reference: orderId,
        description: `Payment received for completed order ${orderId}`,
        createdAt: currentDate,
        status: "SUCCESS",
      });

      // Mark locked tx as completed
      lockedTx.status = "COMPLETED";
      lockedTx.updatedAt = currentDate;

      // Save all changes within the transaction
      await clientWallet.save({ session });
      await artisanWallet.save({ session });
      await lockedTx.save({ session });

      // ── NEW: Credit platform wallet within the SAME session ──────────
      // All four writes are atomic — if any fails, all roll back
      await PlatformWalletService.creditFee(
        {
          amount: platformFee,
          orderId,
          artisanId,
          clientId: lockedTx.userId,
        },
        session,
      );

      //commit the transaction
      await session.commitTransaction();
      console.log(
        `✅ Order ${orderId} settled:\n` +
          `   Total locked:   ₦${totalAmount}\n` +
          `   Artisan gets:   ₦${artisanAmount} (95%)\n` +
          `   Platform fee:   ₦${platformFee} (5%)`,
      );

      await publishActivity({
        action: ACTIVITY_ACTIONS.PAYMENT_RELEASED,
        actorId: artisanId,
        actorRole: "ARTISAN",
        targetId: orderId,
        targetType: "ORDER",
        service: "wallet-service",
        metadata: { amount: totalAmount, artisanAmount, platformFee },
      });

      // await lockedTx.save();

      // Credit artisan wallet
      //await WalletModel.findOneAndUpdate(
      //  { userId: artisanId },
      //  { $inc: { balance: lockedTx.amount } }
      //);
      // Save all changes in a transaction-like manner
      // await Promise.all([
      //   clientWallet.save(),
      //   artisanWallet.save(),
      //   lockedTx.save(),
      // ]);
      //
      // console.log(
      //   `Successfully released ${amount} to artisan ${artisanId} for //order ${orderId}`
      // );
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestError("Failed to release funds to artisan");
    } finally {
      session.endSession();
    }
  }

  static async refundFundsToClient(
    orderId: string,
    clientId?: string, // Optional parameter for validation
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log(`Refunding funds for order ${orderId}`);

      // Find the locked transaction
      const lockedTx = await WalletTransactionModel.findOne({
        orderId,
        status: "LOCKED",
      }).session(session);

      if (!lockedTx) {
        throw new BadRequestError("Locked transaction not found");
      }

      // Validate clientId if provided
      if (clientId && lockedTx.userId !== clientId) {
        throw new BadRequestError("Client ID mismatch");
      }

      // Get the client wallet
      const clientWallet = await WalletModel.findOne({
        userId: lockedTx.userId,
      }).session(session);

      if (!clientWallet) {
        throw new BadRequestError("Client wallet not found");
      }

      const amount = lockedTx.amount;
      const currentDate = new Date();

      // Return funds to available balance and reduce locked balance
      clientWallet.balance += amount;
      clientWallet.lockedBalance -= amount;
      clientWallet.updatedAt = currentDate;

      // Add refund transaction to client wallet
      clientWallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "REFUND",
        amount,
        reference: orderId,
        description: `Refund for cancelled/failed order ${orderId}`,
        createdAt: currentDate,
        status: "SUCCESS",
      });

      // Mark locked transaction as refunded
      lockedTx.status = "REFUNDED";
      lockedTx.updatedAt = currentDate;

      // Save changes within the transaction
      await clientWallet.save({ session });
      await lockedTx.save({ session });
      //await Promise.all([clientWallet.save(), lockedTx.save()]);

      //commit the tx
      await session.commitTransaction();
      console.log(
        `Successfully refunded ${amount} to client ${lockedTx.userId} for order ${orderId}`,
      );
    } catch (error) {
      await session.abortTransaction();
      console.error("Error refunding funds to client:", error);
      throw new Error("Failed to refund funds to client");
    } finally {
      session.endSession();
    }
  }

  static async getWalletBalance(userId: string) {
    try {
      const balance = await WalletModel.findOne({ userId });
      if (!balance) {
        throw new BadRequestError("Wallet not found for the user");
      }
      return {
        balance: balance.balance,
        lockedBalance: balance.lockedBalance,
      };
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      throw new Error("Failed to fetch wallet balance");
    }
  }
  static async getTransactionHistory(userId: string) {
    try {
      const transactionHistory = await WalletTransactionModel.findOne({
        userId,
      });
      if (!transactionHistory) {
        throw new BadRequestError("Failed to fetch transaction history");
      }
      return transactionHistory;
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      throw new Error("Failed to fetch transaction history");
    }
  }
  /**
   * Get list of available banks for withdrawal
   */
  static async getBanksList() {
    try {
      return await PaystackService.getBanks();
    } catch (error: any) {
      console.error("Error fetching banks:", error);
      throw new BadRequestError("Failed to fetch banks list");
    }
  }

  /**
   * Resolve account number to get account name
   */
  static async resolveAccountDetails(accountNumber: string, bankCode: string) {
    try {
      const result = await PaystackService.resolveAccountNumber(
        accountNumber,
        bankCode,
      );
      return {
        accountNumber: result.account_number,
        accountName: result.account_name,
        bankId: result.bank_id,
      };
    } catch (error: any) {
      console.error("Error resolving account:", error);
      throw new BadRequestError(
        "Failed to resolve account details. Please check account number and bank code.",
      );
    }
  }

  /**
   * Initiate withdrawal request
   */
  static async initiateWithdrawal(
    userId: string,
    amount: number,
    accountNumber: string,
    bankCode: string,
    pin?: string, // Optional security PIN
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(
        `Initiating withdrawal for user ${userId}, amount: ${amount}`,
      );

      // Validate minimum withdrawal amount
      const MIN_WITHDRAWAL = 100; // 100 NGN minimum
      if (amount < MIN_WITHDRAWAL) {
        throw new BadRequestError(
          `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL}`,
        );
      }

      // Get user wallet
      const wallet = await WalletModel.findOne({ userId }).session(session);
      if (!wallet) {
        throw new BadRequestError("Wallet not found");
      }

      // Check if user has sufficient balance
      const availableBalance = wallet.balance - wallet.lockedBalance;
      if (availableBalance < amount) {
        throw new BadRequestError(
          `Insufficient balance. Available: ₦${availableBalance}`,
        );
      }

      // Resolve account details
      const accountDetails = await this.resolveAccountDetails(
        accountNumber,
        bankCode,
      );

      // Create transfer recipient
      const recipient = await PaystackService.createTransferRecipient(
        accountNumber,
        bankCode,
        accountDetails.accountName,
      );

      // Generate unique reference
      const reference = `WD_${userId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create withdrawal request record
      const withdrawalRequest = new WithdrawalRequestModel({
        userId,
        amount,
        recipientCode: recipient.recipient_code,
        accountNumber,
        bankCode,
        accountName: recipient.name,
        reference,
        status: "PENDING",
      });

      // Lock funds in wallet (similar to order escrow)
      wallet.balance -= amount;
      wallet.lockedBalance += amount;

      // Add transaction record
      wallet.transactions.push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "WITHDRAWAL_PENDING",
        amount,
        reference,
        description: `Withdrawal to ${recipient.name} - ${accountNumber}`,
        createdAt: new Date(),
        status: "PENDING",
      });

      // Save all changes
      await wallet.save({ session });
      await withdrawalRequest.save({ session });

      await session.commitTransaction();

      console.log(`Withdrawal request created: ${reference}`);

      await publishActivity({
        action: ACTIVITY_ACTIONS.WALLET_WITHDRAWAL,
        actorId: userId,
        actorRole: "ARTISAN", // only artisans withdraw
        service: "wallet-service",
        metadata: { amount, reference },
      });

      return {
        message: "Withdrawal request created successfully",
        withdrawalId: withdrawalRequest.id,
        reference,
        accountName: recipient.name,
        amount,
        status: "PENDING",
      };
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error initiating withdrawal:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /*
  static async processWithdrawal(withdrawalId: string) {
    try {
      console.log(`Processing withdrawal: ${withdrawalId}`);

      // Step 1: Validate and update withdrawal status
      const withdrawalRequest =
        await this.updateWithdrawalToProcessing(withdrawalId);

      // Step 2: Attempt the transfer
      try {
        const transferResult = await PaystackService.initializeTransfer(
          withdrawalRequest.amount * 100, // Convert to kobo
          withdrawalRequest.recipientCode,
          withdrawalRequest.reason || "Wallet withdrawal",
        );

        // Step 3: Update with transfer details
        await WithdrawalRequestModel.findByIdAndUpdate(withdrawalRequest._id, {
          transferCode: transferResult.transfer_code,
          status: "PROCESSING", // Will be updated to COMPLETED via webhook
        });

        console.log(`Transfer initiated: ${transferResult.transfer_code}`);

        return {
          message: "Withdrawal is being processed",
          transferCode: transferResult.transfer_code,
          reference: withdrawalRequest.reference,
          status: "PROCESSING",
        };
      } catch (transferError: any) {
        console.error("Transfer failed:", transferError);

        // Handle the failure (revert status and refund user)
        await this.handleWithdrawalFailure(
          withdrawalRequest.reference,
          transferError.message || "Transfer failed",
        );

        throw new BadRequestError(
          `Withdrawal failed: ${transferError.message}`,
        );
      }
    } catch (error: any) {
      console.error("Process withdrawal error:", error);
      throw error;
    }
  }
    */
  // Fix processWithdrawal to be cleaner
  static async processWithdrawal(withdrawalId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [{ id: withdrawalId }, { reference: withdrawalId }],
      }).session(session);

      if (!withdrawalRequest) {
        throw new BadRequestError("Withdrawal request not found");
      }

      if (withdrawalRequest.status !== "PENDING") {
        throw new BadRequestError(
          `Withdrawal is ${withdrawalRequest.status.toLowerCase()}, cannot process`,
        );
      }

      // Update to processing within same session
      withdrawalRequest.status = "PROCESSING";
      await withdrawalRequest.save({ session });
      await session.commitTransaction();

      // Make the Paystack transfer OUTSIDE the DB transaction
      // (external API calls should never be inside DB transactions)
      try {
        const transferResult = await PaystackService.initializeTransfer(
          withdrawalRequest.amount * 100,
          withdrawalRequest.recipientCode,
          withdrawalRequest.reason || "Wallet withdrawal",
        );

        // Update transfer code separately after commit
        await WithdrawalRequestModel.findByIdAndUpdate(withdrawalRequest._id, {
          transferCode: transferResult.transfer_code,
        });

        return {
          message: "Withdrawal is being processed",
          transferCode: transferResult.transfer_code,
          reference: withdrawalRequest.reference,
          status: "PROCESSING",
        };
      } catch (transferError: any) {
        // Transfer failed after DB commit — revert via failure handler
        await this.handleWithdrawalFailure(
          withdrawalRequest.reference,
          transferError.message || "Transfer failed",
        );
        throw new BadRequestError(
          `Withdrawal failed: ${transferError.message}`,
        );
      }
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static async updateWithdrawalToProcessing(withdrawalId: string) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Get withdrawal request
      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [{ id: withdrawalId }, { reference: withdrawalId }],
      }).session(session);

      if (!withdrawalRequest) {
        throw new BadRequestError("Withdrawal request not found");
      }

      if (withdrawalRequest.status !== "PENDING") {
        throw new BadRequestError(
          `Withdrawal is ${withdrawalRequest.status.toLowerCase()}, cannot process`,
        );
      }

      // Update status to processing
      withdrawalRequest.status = "PROCESSING";
      await withdrawalRequest.save({ session });

      await session.commitTransaction();

      return withdrawalRequest;
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process withdrawal (actually send the money via Paystack)
   * This should be called after any required approvals/verifications
   */
  /*
  static async processWithdrawal(withdrawalId: string) {
    const session = await mongoose.startSession();
    // let isTransactionCommitted = false;
    session.startTransaction();

    try {
      console.log(`Processing withdrawal: ${withdrawalId}`);

      // Get withdrawal request
      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [{ id: withdrawalId }, { reference: withdrawalId }],
      }).session(session);

      if (!withdrawalRequest) {
        throw new BadRequestError("Withdrawal request not found");
      }

      if (withdrawalRequest.status !== "PENDING") {
        throw new BadRequestError(
          `Withdrawal is ${withdrawalRequest.status.toLowerCase()}, cannot process`
        );
      }

      // Update status to processing
      withdrawalRequest.status = "PROCESSING";
      await withdrawalRequest.save({ session });

      await session.commitTransaction();
      isTransactionCommitted = true;

      // Make the actual transfer via Paystack (outside of DB transaction)
      try {
        const transferResult = await PaystackService.initializeTransfer(
          withdrawalRequest.amount * 100, // Convert to kobo
          withdrawalRequest.recipientCode,
          withdrawalRequest.reason || "Wallet withdrawal"
        );

        // Update withdrawal request with transfer details
        await WithdrawalRequestModel.findByIdAndUpdate(withdrawalRequest._id, {
          transferCode: transferResult.transfer_code,
          status: "PROCESSING", // Will be updated to COMPLETED via webhook
        });

        console.log(`Transfer initiated: ${transferResult.transfer_code}`);

        return {
          message: "Withdrawal is being processed",
          transferCode: transferResult.transfer_code,
          reference: withdrawalRequest.reference,
          status: "PROCESSING",
        };
      } catch (transferError: any) {
        console.error("Transfer failed:", transferError);

        // Revert the withdrawal request status and refund user
        await this.handleWithdrawalFailure(
          withdrawalRequest.reference,
          transferError.message || "Transfer failed"
        );

        throw new BadRequestError(
          `Withdrawal failed: ${transferError.message}`
        );
      }
    } catch (error: any) {
      // await session.abortTransaction();
      if (!isTransactionCommitted) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
  */

  /**
   * Handle successful withdrawal (called by webhook)
   */
  static async handleWithdrawalSuccess(transferReference: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`Handling successful withdrawal: ${transferReference}`);

      // Find withdrawal request by transfer reference or our reference
      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [
          { reference: transferReference },
          { transferCode: transferReference },
        ],
      }).session(session);

      if (!withdrawalRequest) {
        console.error(
          `Withdrawal request not found for reference: ${transferReference}`,
        );
        await session.abortTransaction();
        return;
      }

      // Guard against double-processing
      if (withdrawalRequest.status === "COMPLETED") {
        console.log(
          `Withdrawal ${transferReference} already completed, skipping`,
        );
        await session.abortTransaction();
        return;
      }

      if (withdrawalRequest.status !== "PROCESSING") {
        console.warn(
          `Unexpected status ${withdrawalRequest.status} for ${transferReference}`,
        );
        await session.abortTransaction();
        return;
      }

      // Get user wallet
      const wallet = await WalletModel.findOne({
        userId: withdrawalRequest.userId,
      }).session(session);

      if (!wallet) {
        throw new BadRequestError("User wallet not found");
      }

      const amount = withdrawalRequest.amount;

      // Remove from locked balance (money is now sent)
      wallet.lockedBalance -= amount;
      wallet.updatedAt = new Date();

      // Update transaction status to SUCCESS
      const pendingTx = wallet.transactions.find(
        (tx) =>
          tx.reference === withdrawalRequest.reference &&
          tx.purpose === "WITHDRAWAL_PENDING",
      );

      if (pendingTx) {
        pendingTx.status = "SUCCESS";
        pendingTx.purpose = "WITHDRAWAL_COMPLETED";
        pendingTx.description = `Withdrawal completed to- ${withdrawalRequest.accountName}`;
      }

      // Update withdrawal request status
      withdrawalRequest.status = "COMPLETED";

      // Save changes
      await wallet.save({ session });
      await withdrawalRequest.save({ session });

      await session.commitTransaction();

      console.log(
        `Withdrawal completed successfully: ${transferReference},amount: ${amount}`,
      );
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error handling withdrawal success:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle failed withdrawal (called by webhook or on transfer failure)
   */
  static async handleWithdrawalFailure(
    transferReference: string,
    failureReason: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`Handling withdrawal failure: ${transferReference}`);

      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [
          { reference: transferReference },
          { transferCode: transferReference },
        ],
      }).session(session);

      if (!withdrawalRequest) {
        console.error(
          `Withdrawal request not found for reference: ${transferReference}`,
        );
        return;
      }

      // Guard against double-refunding
      if (withdrawalRequest.status === "FAILED") {
        console.log(`Withdrawal ${transferReference} already failed, skipping`);
        await session.abortTransaction();
        return;
      }

      const wallet = await WalletModel.findOne({
        userId: withdrawalRequest.userId,
      }).session(session);

      if (!wallet) {
        throw new BadRequestError("User wallet not found");
      }

      const amount = withdrawalRequest.amount;

      // Refund: move from locked balance back to available balance
      wallet.balance += amount;
      wallet.lockedBalance -= amount;

      // Update transaction
      const pendingTx = wallet.transactions.find(
        (tx) =>
          tx.reference === withdrawalRequest.reference &&
          tx.purpose === "WITHDRAWAL_PENDING",
      );

      if (pendingTx) {
        pendingTx.status = "FAILED";
        pendingTx.purpose = "WITHDRAWAL_FAILED";
        pendingTx.description = `Withdrawal failed: ${failureReason}`;
      }

      // Add refund transaction
      wallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "WITHDRAWAL_REFUND",
        amount,
        reference: withdrawalRequest.reference,
        description: `Refund for failed withdrawal - ${failureReason}`,
        createdAt: new Date(),
        status: "SUCCESS",
      });

      // Update withdrawal request
      withdrawalRequest.status = "FAILED";
      withdrawalRequest.failureReason = failureReason;

      await wallet.save({ session });
      await withdrawalRequest.save({ session });

      await session.commitTransaction();

      console.log(`Withdrawal failure handled: ${transferReference}`);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Error handling withdrawal failure:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get withdrawal history for a user
   */
  static async getWithdrawalHistory(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const withdrawals = await WithdrawalRequestModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await WithdrawalRequestModel.countDocuments({ userId });

      return {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("Error fetching withdrawal history:", error);
      throw new BadRequestError("Failed to fetch withdrawal history");
    }
  }

  /**
   * Get pending withdrawals (for admin/processing)
   */
  static async getPendingWithdrawals() {
    try {
      return await WithdrawalRequestModel.find({
        status: { $in: ["PENDING", "PROCESSING"] },
      }).sort({ createdAt: 1 });
    } catch (error: any) {
      console.error("Error fetching pending withdrawals:", error);
      throw new BadRequestError("Failed to fetch pending withdrawals");
    }
  }

  /**
   * Cancel withdrawal (only if still pending)
   */
  static async cancelWithdrawal(userId: string, withdrawalId: string) {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const withdrawalRequest = await WithdrawalRequestModel.findOne({
        $or: [{ id: withdrawalId }, { reference: withdrawalId }],
        userId,
      });
      // }).session(session);

      if (!withdrawalRequest) {
        throw new BadRequestError("Withdrawal request not found");
      }

      if (withdrawalRequest.status !== "PENDING") {
        throw new BadRequestError(
          `Cannot cancel ${withdrawalRequest.status.toLowerCase()} withdrawal`,
        );
      }

      // Refund the amount
      // handleWithdrawalFailure manages its own transaction internally
      await this.handleWithdrawalFailure(
        withdrawalRequest.reference,
        "Cancelled by user",
      );

      // await session.commitTransaction();

      return {
        message: "Withdrawal cancelled successfully",
        refundedAmount: withdrawalRequest.amount,
      };
    } catch (error: any) {
      // await session.abortTransaction();
      throw new BadRequestError(error.message || "Failed to cancel withdrawal");
    }
    // finally {
    // session.endSession();
    // }
  }

  // In walletService.ts

  static async manualLockFunds(
    userId: string,
    amount: number,
    password: string,
  ): Promise<{
    message: string;
    lockedBalance: number;
    availableBalance: number;
  }> {
    // Step 1: Verify password via user-management service
    const isValidPassword = await UserManagementClient.verifyPassword(
      userId,
      password,
    );
    if (!isValidPassword) {
      throw new BadRequestError("Incorrect password");
    }

    // Step 2: Perform the lock within a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.findOne({ userId }).session(session);
      if (!wallet) {
        throw new BadRequestError("Wallet not found");
      }

      const availableBalance = wallet.balance - wallet.lockedBalance;
      if (availableBalance < amount) {
        throw new BadRequestError(
          `Insufficient available balance. Available: ₦${availableBalance}`,
        );
      }

      if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
      }

      const reference = `MANUAL_LOCK_${userId}_${Date.now()}`;

      wallet.balance -= amount; //my fix
      wallet.lockedBalance += amount;
      wallet.transactions.push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "MANUAL_LOCK",
        amount,
        reference,
        description: `Manual fund lock of ₦${amount}`,
        createdAt: new Date(),
        status: "SUCCESS",
      });
      wallet.updatedAt = new Date();

      await wallet.save({ session });
      await session.commitTransaction();

      return {
        message: `₦${amount} locked successfully`,
        lockedBalance: wallet.lockedBalance,
        // availableBalance: wallet.balance - wallet.lockedBalance,
        availableBalance: wallet.balance,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async manualUnlockFunds(
    userId: string,
    amount: number,
    password: string,
  ): Promise<{
    message: string;
    lockedBalance: number;
    availableBalance: number;
  }> {
    // Step 1: Verify password
    const isValidPassword = await UserManagementClient.verifyPassword(
      userId,
      password,
    );
    if (!isValidPassword) {
      throw new BadRequestError("Incorrect password");
    }

    // Step 2: Perform the unlock
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.findOne({ userId }).session(session);
      if (!wallet) {
        throw new BadRequestError("Wallet not found");
      }

      if (amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
      }

      // Only allow unlocking manually locked funds
      // We track manual locks separately to avoid accidentally unlocking escrow funds
      const manualLockedAmount = await this.getManualLockedAmount(userId);
      if (amount > manualLockedAmount) {
        throw new BadRequestError(
          `Cannot unlock ₦${amount}. You only have ₦${manualLockedAmount} in manually locked funds`,
        );
      }

      const reference = `MANUAL_UNLOCK_${userId}_${Date.now()}`;

      wallet.balance += amount; // my fix

      wallet.lockedBalance -= amount;
      wallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "MANUAL_UNLOCK",
        amount,
        reference,
        description: `Manual fund unlock of ₦${amount}`,
        createdAt: new Date(),
        status: "SUCCESS",
      });
      wallet.updatedAt = new Date();

      await wallet.save({ session });
      await session.commitTransaction();

      return {
        message: `₦${amount} unlocked successfully`,
        lockedBalance: wallet.lockedBalance,
        // availableBalance: wallet.balance - wallet.lockedBalance,
        availableBalance: wallet.balance,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Helper to sum only manual locks (not order escrow locks)
  private static async getManualLockedAmount(userId: string): Promise<number> {
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) return 0;

    return (
      wallet.transactions
        .filter((tx) => tx.purpose === "MANUAL_LOCK" && tx.status === "SUCCESS")
        .reduce((sum, tx) => {
          // Subtract any manual unlocks
          return sum + tx.amount;
        }, 0) -
      wallet.transactions
        .filter(
          (tx) => tx.purpose === "MANUAL_UNLOCK" && tx.status === "SUCCESS",
        )
        .reduce((sum, tx) => sum + tx.amount, 0)
    );
  }

  // Get breakdown of locked funds (manual vs order escrow)
  static async getLockedFundsBreakdown(userId: string): Promise<{
    totalLocked: number;
    manuallyLocked: number;
    orderEscrow: number;
    available: number;
    availableAfterDifference: number;
  }> {
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) throw new BadRequestError("Wallet not found");

    const manuallyLocked = await this.getManualLockedAmount(userId);
    const totalLocked = wallet.lockedBalance;
    const orderEscrow = totalLocked - manuallyLocked;

    return {
      totalLocked,
      manuallyLocked,
      orderEscrow,
      // available: wallet.balance - totalLocked,
      available: wallet.balance,
      availableAfterDifference: wallet.balance - totalLocked,
    };
  }

  static async monitorTransactions(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    purpose?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const PLATFORM_FEE = 2000;

    const transactionMatch: any = {};

    if (filters.status) {
      transactionMatch["transactions.status"] = filters.status;
    }
    if (filters.purpose) {
      transactionMatch["transactions.purpose"] = filters.purpose;
    }
    if (filters.startDate || filters.endDate) {
      transactionMatch["transactions.createdAt"] = {};
      if (filters.startDate) {
        transactionMatch["transactions.createdAt"].$gte = new Date(
          filters.startDate,
        );
      }
      if (filters.endDate) {
        transactionMatch["transactions.createdAt"].$lte = new Date(
          filters.endDate,
        );
      }
    }

    const pipeline: any[] = [
      { $unwind: "$transactions" },
      ...(Object.keys(transactionMatch).length > 0
        ? [{ $match: transactionMatch }]
        : []),
      { $sort: { "transactions.createdAt": -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                walletUserId: "$userId",
                walletRole: "$role",
                transactionId: "$transactions.id",
                type: "$transactions.type",
                purpose: "$transactions.purpose",
                amount: "$transactions.amount",
                reference: "$transactions.reference",
                description: "$transactions.description",
                status: "$transactions.status",
                createdAt: "$transactions.createdAt",
              },
            },
          ],
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalAmount: { $sum: "$transactions.amount" },
              },
            },
          ],
        },
      },
    ];

    const [result] = await WalletModel.aggregate(pipeline);
    const rawTransactions = result.data || [];
    const total = result.totals[0]?.total || 0;
    const totalAmount = result.totals[0]?.totalAmount || 0;

    // Step 1: Collect order IDs (exclude withdrawal and manual references)
    const orderIds = [
      ...new Set(
        rawTransactions
          .map((t: any) => t.reference)
          .filter(
            (ref: string) =>
              ref &&
              !ref.startsWith("WD_") &&
              !ref.startsWith("MANUAL_LOCK") &&
              !ref.startsWith("MANUAL_UNLOCK"),
          ),
      ),
    ] as string[];

    // Step 2: Fetch orders first
    const orderMap =
      orderIds.length > 0
        ? await OrderClient.getBulkOrderDetails(orderIds)
        : {};

    // console.log("orderMap:", orderMap);

    // Step 3: Collect ALL user IDs from both wallet owners AND order participants
    const walletOwnerIds = rawTransactions.map((t: any) => t.walletUserId);

    const orderParticipantIds = Object.values(orderMap).flatMap((o: any) =>
      [o.clientId, o.artisanId].filter(Boolean),
    );

    // Merge all IDs and deduplicate
    const allUserIds = [
      ...new Set([...walletOwnerIds, ...orderParticipantIds]),
    ] as string[];

    // console.log("Fetching users for IDs:", allUserIds);

    // Step 4: Fetch ALL users in one single call
    const userMap =
      allUserIds.length > 0
        ? await UserManagementClient.getBulkUserDetails(allUserIds)
        : {};

    // console.log("userMap:", userMap);

    // Step 5: Build enriched transactions
    const transactions = rawTransactions.map((t: any) => {
      const order = orderMap[t.reference] || null;
      const walletUser = userMap[t.walletUserId] || null;
      const client = order?.clientId ? userMap[order.clientId] || null : null;
      const artisan = order?.artisanId
        ? userMap[order.artisanId] || null
        : null;

      const isCompletedOrderTx =
        t.purpose === "PAYMENT_COMPLETED" || t.purpose === "PAYMENT_RECEIVED";

      //console.log(
      //  "order:",
      //  order,
      //  "wallet:",
      //  walletUser,
      //  "client:",
      //  client,
      //  "artisan:",
      //  artisan,
      //);

      return {
        transactionId: t.transactionId || t.reference,
        type: t.type,
        purpose: t.purpose,
        amount: t.amount,
        fee: isCompletedOrderTx ? PLATFORM_FEE : 0,
        status: t.status,
        date: t.createdAt,
        description: t.description || "",
        reference: t.reference,

        walletOwner: walletUser
          ? {
              id: t.walletUserId,
              fullName: walletUser.fullName,
              email: walletUser.email,
              role: t.walletRole,
            }
          : {
              id: t.walletUserId,
              fullName: "Unknown",
              email: "",
              role: t.walletRole,
            },

        order: order
          ? {
              orderId: t.reference,
              item: order.item,
              orderStatus: order.status,
              orderAmount: order.price,
            }
          : null,

        client: client
          ? {
              id: order?.clientId,
              fullName: client.fullName,
              email: client.email,
            }
          : null,

        artisan: artisan
          ? {
              id: order?.artisanId,
              fullName: artisan.fullName,
              email: artisan.email,
              businessName: artisan.businessName,
            }
          : null,
      };
    });

    const completedCount = transactions.filter(
      (t: any) => t.purpose === "PAYMENT_COMPLETED",
    ).length;

    return {
      transactions,
      total,
      totalAmount,
      totalFees: completedCount * PLATFORM_FEE,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

/*
  // Simple in-memory cache
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

static async getUserByEmail(email: string, maxRetries = 3) {
  // Check cache first
  const cached = userCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Returning cached user for ${email}`);
    return cached.user;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(
        `${process.env.USER_MANAGEMENT_URL}/api/admin/users/email/${email}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'WalletService/1.0',
          }
        }
      );

      // Cache the successful response
      userCache.set(email, {
        user: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error: any) {
      // ... rest of error handling logic from previous example
      console.error(`Attempt ${attempt} - Error fetching user by email:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        email: email
      });

      if (error.response?.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited. Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        } else {
          throw new Error(`Rate limited after ${maxRetries} attempts. Please try again later.`);
        }
      }

      if (attempt === maxRetries) {
        throw new Error("Failed to fetch user by email after multiple attempts");
      }
    }
  }
}
 */
