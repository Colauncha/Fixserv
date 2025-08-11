import { AuthMiddleware, ValidateRequest } from "@fixserv-colauncha/shared";
import { Router } from "express";
import { body } from "express-validator";
import express, { Request, Response } from "express";
import { WalletService } from "../../../application/services/walletService";
import { WalletController } from "../../../interfaces/controller/walletController";
const authMiddleware = new AuthMiddleware();
const validate = new ValidateRequest();
const router = Router();

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
    res.status(200).json(paymentUrl);
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

router.post("/lock-funds", WalletController.lockFundsForOrderHandler);

router.post("/release-funds", WalletController.releaseFundsToArtisanHandler);

router.get("/top-up/verify/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;
  const data = await WalletService.verifyTopup(reference);
  res.status(200).json(data);
});

router.get("/get-balance/:userId", WalletController.getWalletBalanceHandler);
router.get(
  "/get-transaction/:userId",
  WalletController.getTransactionHistoryHandler
);

router.post(
  "/paystack/webhook",
  express.json(),
  WalletController.handlePaystackWebhook
);

export { router as walletRouter };
