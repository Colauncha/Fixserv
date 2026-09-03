import { Router } from "express";
import { ReferralQrController } from "../../controllers/referralController";
import { AuthMiddleware } from "@fixserv-colauncha/shared";

export const referralRouter = Router();
const authMiddleware = new AuthMiddleware();

// Authenticated — get your own referral QR
referralRouter.get(
  "/qr",
  authMiddleware.protect,
  ReferralQrController.getMyReferralQr,
);

// Authenticated — get SVG version (for download)
referralRouter.get(
  "/qr/svg",
  authMiddleware.protect,
  ReferralQrController.getMyReferralQrSvg,
);

// Public — validate a scanned referral code before signup
referralRouter.get("/validate/:code", ReferralQrController.validateCode);
