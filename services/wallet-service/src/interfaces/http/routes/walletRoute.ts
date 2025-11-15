import axios from "axios";
import { AuthMiddleware, ValidateRequest } from "@fixserv-colauncha/shared";
import { Router } from "express";
import { body, param, query } from "express-validator";
import express, { Request, Response } from "express";
import { WalletService } from "../../../application/services/walletService";
import { WalletController } from "../../../interfaces/controller/walletController";
const authMiddleware = new AuthMiddleware();
const validate = new ValidateRequest();
const router = Router();

const service = `${process.env.WALLET_SERVICE_URL}/api/wallet/health`;
setInterval(async () => {
  const ENV = process.env.ENV?.toLowerCase();
  console.log(ENV);
  if (ENV !== "development") {
    console.log("Skipping health check pings in non-development environment");
    return
  }
  for (const url of [service]) {
    try {
      await axios.get(url, { timeout: 5000 });
      console.log(`✅ Pinged ${url}`);
    } catch (error: any) {
      console.error(`❌ Failed to ping ${url}:`, error.message);
    }
  }
}, 2 * 60 * 1000); // every 5 minutes
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "wallet-service",
  });
});

router.post(
  "/top-up",
  [
    body("amount").isNumeric().withMessage("Amount is required"),
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validate.validateRequest,
  async (req: Request, res: Response) => {
    const { amount, email } = req.body;
    const paymentUrl = await WalletService.initiateTopup(amount, email);
    res.status(200).json({
      success: true,
      message: "Payment URL generated successfully",
      data: {
        paymentUrl,
        instructions:
          "Complete payment at the provided URL. Your wallet will be automatically credited upon successful payment.",
      },
    });
  }
);

//router.post("/lock-funds", async (req: Request, res: Response) => {
//  const { userId, orderId, amount } = req.body;
//  const data = await WalletService.lockFundsForOrder(userId, orderId, //amount);
//  res.status(200).json(data);
//});
//
//router.post("/release-funds", async (req: Request, res: Response) => {
//  const { orderId, artisanId } = req.body;
//  const data = await WalletService.releaseFundsToArtisan(orderId, //artisanId);
//  res.status(200).json(data);
//});

/////////////////////////////
// ==================== WITHDRAWAL ROUTES ====================

// Get banks list for withdrawal
router.get("/withdrawal/banks", WalletController.getBanksListHandler);

// Resolve account details
router.post(
  "/withdrawal/resolve-account",
  [
    body("accountNumber")
      .isLength({ min: 10, max: 10 })
      .withMessage("Account number must be 10 digits")
      .matches(/^\d+$/)
      .withMessage("Account number must contain only digits"),
    body("bankCode").notEmpty().withMessage("Bank code is required"),
  ],
  validate.validateRequest,
  WalletController.resolveAccountHandler
);

// Initiate withdrawal
router.post(
  "/withdrawal/initiate",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("amount")
      .isFloat({ min: 100 })
      .withMessage("Amount must be at least 100 NGN"),
    body("accountNumber")
      .isLength({ min: 10, max: 10 })
      .withMessage("Account number must be 10 digits")
      .matches(/^\d+$/)
      .withMessage("Account number must contain only digits"),
    body("bankCode").notEmpty().withMessage("Bank code is required"),
    body("pin")
      .optional()
      .isLength({ min: 4 })
      .withMessage("PIN must be at least 4 characters"),
  ],
  validate.validateRequest,
  WalletController.initiateWithdrawalHandler
);

// Process withdrawal (admin/automated endpoint)
router.post(
  "/withdrawal/process/:withdrawalId",
  [param("withdrawalId").notEmpty().withMessage("Withdrawal ID is required")],
  validate.validateRequest,
  // authMiddleware.requireAdmin, // Uncomment if you have admin middleware
  WalletController.processWithdrawalHandler
);

// Get withdrawal history for a user
router.get(
  "/withdrawal/history/:userId",
  [
    param("userId").notEmpty().withMessage("User ID is required"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  validate.validateRequest,
  WalletController.getWithdrawalHistoryHandler
);

// Get pending withdrawals (admin endpoint)
router.get(
  "/withdrawal/pending",
  // authMiddleware.requireAdmin, // Uncomment if you have admin middleware
  WalletController.getPendingWithdrawalsHandler
);

// Cancel withdrawal
router.delete(
  "/withdrawal/cancel/:userId/:withdrawalId",
  [
    param("userId").notEmpty().withMessage("User ID is required"),
    param("withdrawalId").notEmpty().withMessage("Withdrawal ID is required"),
  ],
  validate.validateRequest,
  WalletController.cancelWithdrawalHandler
);
///////////////////////////////////////////////////////

router.post("/lock-funds", WalletController.lockFundsForOrderHandler);

router.post("/release-funds", WalletController.releaseFundsToArtisanHandler);

router.post("/refund-funds", WalletController.refundFundsToClientHandler);

router.get("/top-up/verify/:reference", async (req: Request, res: Response) => {
  console.log(
    "⚠️ Manual verification endpoint called - should only be used for debugging"
  );
  const { reference } = req.params;
  const data = await WalletService.verifyTopup(reference);
  res.status(200).json(data);
});

router.get("/get-balance/:userId", WalletController.getWalletBalanceHandler);
router.get(
  "/get-transaction/:userId",
  WalletController.getTransactionHistoryHandler
);

//router.post(
//  "/paystack/webhook",
//  express.raw({ type: "application/json" }),
//  WalletController.handlePaystackWebhook
//);

// Health check for webhook
router.get("/webhook/health", WalletController.webhookHealthCheck);

// Add these routes to your existing router
// routes/walletRoutes.ts (additional routes)

// Referral and Fixpoints routes
router.post("/signup", WalletController.handleNewUserSignupHandler);
router.post(
  "/artisan/verify",
  WalletController.handleArtisanVerificationHandler
);
router.get(
  "/fixpoints/balance/:userId",
  WalletController.getFixpointsBalanceHandler
);
router.post("/fixpoints/redeem", WalletController.redeemFixpointsHandler);
router.get("/referral/info/:userId", WalletController.getReferralInfoHandler);
router.get(
  "/fixpoints/history/:userId",
  WalletController.getFixpointsTransactionHistoryHandler
);
router.get(
  "/referral/validate/:code",
  WalletController.validateReferralCodeHandler
);
router.get("/referral/analytics", WalletController.getReferralAnalyticsHandler); // Admin only

//router.get("/paystack/webhook/test", (req, res) => {
//  console.log("🧪 Webhook test endpoint called");
//  res.status(200).json({
//    success: true,
//    message: "Webhook endpoint is accessible",
//    timestamp: new Date().toISOString(),
//    url: req.originalUrl,
//    method: req.method,
//  });
//});

//router.post(
//  "/paystack/webhook",
//  express.raw({ type: "application/json" }),
//  async (req: any, res: any) => {
//    console.log("🔥 WEBHOOK CALLED! Raw details:");
//    console.log("Headers:", JSON.stringify(req.//headers, null, 2));
//    console.log("Body type:", typeof req.body);
//    console.log("Body length:", req.body ? req.body.//length : 0);
//    console.log("Raw body:", req.body);
//
//    // Convert raw buffer to JSON
//    let webhookData;
//    try {
//      const bodyString = req.body.toString();
//      console.log("Body as string:", bodyString);
//      webhookData = JSON.parse(bodyString);
//      console.log("Parsed webhook data:", JSON.//stringify(webhookData, null, 2));
//    } catch (error) {
//      console.error("❌ Failed to parse webhook //body:", error);
//      return res.status(400).json({ error: "Invalid //JSON" });
//    }
//
//    // Check for Paystack signature
//    const signature = req.headers//["x-paystack-signature"];
//    console.log("Paystack signature:", signature);
//
//    if (!signature) {
//      console.log(
//        "⚠️ No Paystack signature found - this might //not be from Paystack"
//      );
//    }
//
//    // Log the event type
//    console.log("Event type:", webhookData.event);
//    console.log("Event data:", JSON.stringify//(webhookData.data, null, 2));
//
//    // Simple response to acknowledge receipt
//    res.status(200).json({
//      received: true,
//      event: webhookData.event,
//      timestamp: new Date().toISOString(),
//    });
//  }
//);
export { router as walletRouter };
