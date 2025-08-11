import axios from "axios";
import { BadRequestError } from "@fixserv-colauncha/shared";

const walletServiceBaseURL = process.env.WALLET_SERVICE_URL;

export class WalletClient {
  static async lockFundsForOrder(
    clientId: string,
    orderId: string,
    amount: number
  ) {
    try {
      const response = await axios.post(`${walletServiceBaseURL}/lock-funds`, {
        userId: clientId,
        orderId,
        amount,
      });

      console.log("Locked funds response", response.data);

      return response.data;
    } catch (error: any) {
      console.error(
        "Wallet lock failed:",
        error.response?.data || error.message
      );
      throw new BadRequestError(
        error.response?.data?.message || "Failed to lock wallet funds"
      );
    }
  }

  // You can also add:
  static async releaseFundsToArtisan(orderId: string, artisanId: string) {
    try {
      const response = await axios.post(
        `${walletServiceBaseURL}/release-funds`,
        {
          orderId,
          artisanId,
        }
      );
      console.log("Release funds response", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "Wallet release failed:",
        error.response?.data || error.message
      );
      throw new BadRequestError(
        error.response?.data?.message || "Failed to release wallet funds"
      );
    }
  }
  // static async refundClient(...) {}
}
