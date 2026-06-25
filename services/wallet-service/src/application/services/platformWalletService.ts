import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { PlatformWalletModel } from "../../infrastructure/persistence/models/platformWalletModel";
import { PaystackService } from "../../infrastructure/payments/paystackService";

export const PLATFORM_FEE_PERCENT = 0.05; // 5%

export class PlatformWalletService {
  // ─── Called inside releaseFundsToArtisan within the SAME session ─────
  // This ensures the fee credit is atomic with the artisan credit.
  // If either fails, both roll back.
  static async creditFee(
    data: {
      amount: number;
      orderId: string;
      artisanId: string;
      clientId: string;
    },
    session: mongoose.mongo.ClientSession, // ← accepts the caller's session
  ): Promise<void> {
    await PlatformWalletModel.findOneAndUpdate(
      { accountId: "fixserv_platform" },
      {
        $inc: {
          balance: data.amount,
          totalEarned: data.amount,
          totalOrders: 1,
        },
        $push: {
          transactions: {
            id: uuidv4(),
            type: "CREDIT",
            purpose: "PLATFORM_FEE",
            amount: data.amount,
            orderId: data.orderId,
            artisanId: data.artisanId,
            clientId: data.clientId,
            description: `5% platform fee for order ${data.orderId}`,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true, session }, // ← same session = atomic
    );

    console.log(
      `✅ Platform fee ₦${data.amount} credited for order ${data.orderId}`,
    );
  }

  // ─── Admin: get balance and stats ─────────────────────────────────────
  static async getBalance() {
    const wallet = await PlatformWalletModel.findOne({
      accountId: "fixserv_platform",
    }).lean();

    if (!wallet) throw new BadRequestError("Platform wallet not found");

    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      totalOrders: wallet.totalOrders,
      availableForWithdrawal: wallet.balance,
    };
  }

  // ─── Admin: paginated transaction history ──────────────────────────────
  static async getTransactions(page = 1, limit = 20) {
    const wallet = await PlatformWalletModel.findOne({
      accountId: "fixserv_platform",
    }).lean();

    if (!wallet) throw new BadRequestError("Platform wallet not found");

    const skip = (page - 1) * limit;
    const total = wallet.transactions.length;

    const transactions = [...wallet.transactions]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(skip, skip + limit);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        totalOrders: wallet.totalOrders,
      },
    };
  }

  // ─── Admin: withdraw platform earnings to a real bank account ─────────
  static async initiateWithdrawal(data: {
    adminId: string;
    amount: number;
    accountNumber: string;
    bankCode: string;
  }): Promise<{
    message: string;
    reference: string;
    transferCode: string;
    amount: number;
    accountName: string;
  }> {
    const { adminId, amount, accountNumber, bankCode } = data;

    if (amount <= 0)
      throw new BadRequestError("Amount must be greater than zero");

    // ── Step 1: Deduct from platform wallet (DB transaction) ─────────────
    const session = await mongoose.startSession();
    session.startTransaction();
    let reference: string;

    try {
      const wallet = await PlatformWalletModel.findOne({
        accountId: "fixserv_platform",
      }).session(session);

      if (!wallet) throw new BadRequestError("Platform wallet not found");

      if (wallet.balance < amount) {
        throw new BadRequestError(
          `Insufficient platform balance. Available: ₦${wallet.balance}`,
        );
      }

      // Resolve account before deducting so we fail fast on bad bank details
      const accountDetails = await PaystackService.resolveAccountNumber(
        accountNumber,
        bankCode,
      );

      reference = `PLATFORM_WD_${adminId}_${Date.now()}`;

      wallet.balance -= amount;
      wallet.totalWithdrawn += amount;
      (wallet.transactions as any[]).push({
        id: uuidv4(),
        type: "DEBIT",
        purpose: "ADMIN_WITHDRAWAL",
        amount,
        reference,
        description: `Admin withdrawal by ${adminId} to ${accountDetails.account_name}`,
        createdAt: new Date(),
      });

      await wallet.save({ session });
      await session.commitTransaction();

      // ── Step 2: Initiate Paystack transfer AFTER DB commit ──────────────
      // (external API calls must never be inside a DB transaction)
      const recipient = await PaystackService.createTransferRecipient(
        accountNumber,
        bankCode,
        accountDetails.account_name,
      );

      let transferResult;
      try {
        transferResult = await PaystackService.initializeTransfer(
          amount * 100, // Paystack expects kobo
          recipient.recipient_code,
          "Fixserv platform earnings withdrawal",
        );
      } catch (transferError: any) {
        // Transfer failed AFTER DB commit — reverse the deduction
        await PlatformWalletModel.findOneAndUpdate(
          { accountId: "fixserv_platform" },
          {
            $inc: { balance: amount, totalWithdrawn: -amount },
            $push: {
              transactions: {
                id: uuidv4(),
                type: "CREDIT",
                purpose: "REFUND_ADJUSTMENT",
                amount,
                reference,
                description: `Reversal for failed withdrawal: ${transferError.message}`,
                createdAt: new Date(),
              },
            },
          },
        );
        throw new BadRequestError(
          `Transfer failed: ${transferError.message}. Amount has been reversed.`,
        );
      }

      console.log(
        `✅ Platform withdrawal ₦${amount} initiated. ` +
          `Transfer: ${transferResult.transfer_code}`,
      );

      return {
        message: "Platform withdrawal initiated successfully",
        reference,
        transferCode: transferResult.transfer_code,
        amount,
        accountName: accountDetails.account_name,
      };
    } catch (error: any) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
