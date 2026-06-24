import { Request, Response } from "express";
import { PlatformWalletService } from "../../application/services/platformWalletService";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class PlatformWalletController {
  // GET /api/admin/platform-wallet/balance
  static async getBalance(req: Request, res: Response) {
    try {
      const data = await PlatformWalletService.getBalance();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/admin/platform-wallet/transactions?page=1&limit=20
  static async getTransactions(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const data = await PlatformWalletService.getTransactions(page, limit);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/admin/platform-wallet/withdraw
  // Body: { amount: number, accountNumber: string, bankCode: string }
  static async initiateWithdrawal(req: Request, res: Response) {
    try {
      const { amount, accountNumber, bankCode } = req.body;
      const adminId = req.currentUser!.id;

      if (!amount || !accountNumber || !bankCode) {
        throw new BadRequestError(
          "amount, accountNumber, and bankCode are required",
        );
      }
      if (typeof amount !== "number" || amount <= 0) {
        throw new BadRequestError("amount must be a positive number");
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        throw new BadRequestError("accountNumber must be 10 digits");
      }

      const result = await PlatformWalletService.initiateWithdrawal({
        adminId,
        amount,
        accountNumber,
        bankCode,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
