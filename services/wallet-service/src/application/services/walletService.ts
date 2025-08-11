import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { PaystackService } from "../../infrastructure/payments/paystackService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import {
  WalletModel,
  WalletTransactionModel,
} from "../../infrastructure/persistence/models/walletModel";

export class WalletService {
  static async initiateTopup(amount: number, email: string) {
    try {
      const paymentUrl = await PaystackService.initializePayment(
        amount * 100,
        email
      );
      return paymentUrl;
    } catch (error) {
      console.error("Error initiating topup:", error);
      throw new Error("Failed to initiate topup");
    }
  }
  static async verifyTopup(reference: string) {
    try {
      const result = await PaystackService.verifyPayment(reference);
      const { amount, customer } = result;
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

  static async lockFundsForOrder(
    clientId: string,
    orderId: string,
    amount: number
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log("Looking for wallet with userId:", clientId);
      const wallet = await WalletModel.findOne({ userId: clientId }).session(
        session
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
    clientId?: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log(
        `Releasing funds for order ${orderId} to artisan ${artisanId}`
      );

      const lockedTx = await WalletTransactionModel.findOne({
        orderId,
        status: "LOCKED",
      }).session(session);

      if (!lockedTx) {
        throw new BadRequestError("Locked transaction not found");
      }
      console.log(
        `Found locked transaction: ${lockedTx.amount} for user ${lockedTx.userId}`
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

      const amount = lockedTx.amount;
      const currentDate = new Date();

      // Update client wallet - reduce locked balance
      clientWallet.lockedBalance -= amount;
      clientWallet.updatedAt = currentDate;

      // Add completion transaction to client wallet
      clientWallet.transactions.push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "PAYMENT_COMPLETED",
        amount,
        reference: orderId,
        description: `Payment completed for order ${orderId} - funds released to artisan`,
        createdAt: currentDate,
        status: "SUCCESS",
      });

      // Update artisan wallet - add balance
      artisanWallet.balance += amount;
      artisanWallet.updatedAt = currentDate;

      // Add credit transaction to artisan wallet
      artisanWallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "PAYMENT_RECEIVED",
        amount,
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

      //commit the transaction
      await session.commitTransaction();
      console.log(
        `Successfully released ${amount} to artisan ${artisanId} for order ${orderId}`
      );

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
    clientId?: string // Optional parameter for validation
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
        `Successfully refunded ${amount} to client ${lockedTx.userId} for order ${orderId}`
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
}
