import { Router } from "express";
import { PlatformWalletController } from "../../controller/platformWalletController";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";

 const router = Router();

const authMiddleware = new AuthMiddleware();

// All routes are ADMIN-only
router.use(authMiddleware.protect, requireRole("ADMIN"));

// GET  /api/admin/platform-wallet/balance
router.get("/balance", PlatformWalletController.getBalance);

// GET  /api/admin/platform-wallet/transactions?page=1&limit=20
router.get(
  "/transactions",
  PlatformWalletController.getTransactions,
);

// POST /api/admin/platform-wallet/withdraw
router.post(
  "/withdraw",
  PlatformWalletController.initiateWithdrawal,
);

export {router as platformWalletRouter};
