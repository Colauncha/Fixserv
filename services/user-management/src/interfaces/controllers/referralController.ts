import { Request, Response } from "express";
import { ReferralQrService } from "../../application/services/referralQrService";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class ReferralQrController {
  // GET /api/referral/qr
  // Logged-in user gets their own referral QR code (PNG base64)
  static async getMyReferralQr(req: Request, res: Response) {
    try {
      const userId = req.currentUser!.id;

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new BadRequestError("Authorization token is required");
      }

      const token = authHeader.replace("Bearer ", "");

      const result = await ReferralQrService.generateReferralQr(userId, token);

      res.status(200).json({
        success: true,
        data: {
          qrCodeDataUrl: result.qrCodeDataUrl, // paste into <img src>
          referralLink: result.referralLink, // share as a plain link too
          referralCode: result.referralCode, // show as text fallback
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/referral/qr/svg
  // Same but returns raw SVG — useful for download or custom styling
  static async getMyReferralQrSvg(req: Request, res: Response) {
    try {
      const userId = req.currentUser!.id;

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new BadRequestError("Authorization token is required");
      }
      const token = authHeader.replace("Bearer ", "");

      const result = await ReferralQrService.generateReferralQrSvg(
        userId,
        token,
      );

      // Return as SVG image directly — browser can display or download it
      res.setHeader("Content-Type", "image/svg+xml");
      res.status(200).send(result.qrCodeSvg);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /api/referral/validate/:code
  // Called by frontend when signup page loads with ?ref=CODE in URL
  static async validateCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const result = await ReferralQrService.validateReferralCode(code);
      res
        .status(result.valid ? 200 : 400)
        .json({ success: result.valid, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
