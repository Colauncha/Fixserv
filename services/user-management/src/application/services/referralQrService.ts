import QRCode from "qrcode";
import axios from "axios";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { WalletClient } from "./../../infrastructure/clients/walletClient";

export class ReferralQrService {
  static async generateReferralQr(
    userId: string,
    token: string,
  ): Promise<{
    qrCodeDataUrl: string;
    referralLink: string;
    referralCode: string;
  }> {
    // Fetch referral code from wallet-service (single source of truth)
    const referralData = await WalletClient.getReferralCode(userId, token);

    if (!referralData?.code) {
      throw new BadRequestError(
        "No referral code found. Make sure your wallet is set up.",
      );
    }

    const referralLink = `${process.env.FIXSERV_FRONTEND}/auth/register?ref=${referralData.code}`;

    const qrCodeDataUrl = await QRCode.toDataURL(referralLink, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });

    return {
      qrCodeDataUrl,
      referralLink,
      referralCode: referralData.code,
    };
  }

  static async generateReferralQrSvg(
    userId: string,
    token: string,
  ): Promise<{
    qrCodeSvg: string;
    referralLink: string;
    referralCode: string;
  }> {
    const referralData = await WalletClient.getReferralCode(userId, token);

    if (!referralData?.code) {
      throw new BadRequestError("No referral code found.");
    }

    const referralLink = `${process.env.FIXSERV_FRONTEND}/auth/register?ref=${referralData.code}`;

    const qrCodeSvg = await QRCode.toString(referralLink, {
      type: "svg",
      width: 300,
      margin: 2,
    });

    return { qrCodeSvg, referralLink, referralCode: referralData.code };
  }

  // Validate a referral code — still calls wallet-service
  // Your existing /referral/validate/:code endpoint in wallet-service
  // already does this, so just proxy it
  static async validateReferralCode(code: string): Promise<{
    valid: boolean;
    userType?: string;
    message: string;
  }> {
    if (!code?.trim()) {
      return { valid: false, message: "No referral code provided" };
    }

    try {
      const response = await axios.get(
        `${process.env.WALLET_SERVICE_URL}/api/wallet/referral/validate/${code}`,
        {
          timeout: 5000,
          headers: { "X-Internal-Service": "true" },
        },
      );

      return {
        valid: response.data?.isValid ?? false,
        userType: response.data?.data?.userType,
        message: response.data?.message ?? "Valid referral code",
      };
    } catch (error: any) {
      // 404 or 400 from wallet-service means invalid code
      return {
        valid: false,
        message: "Invalid or expired referral code",
      };
    }
  }
}
