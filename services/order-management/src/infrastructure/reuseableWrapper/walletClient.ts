/*
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
*/

import axios from "axios";
import { BadRequestError } from "@fixserv-colauncha/shared";

const walletServiceBaseURL = process.env.WALLET_SERVICE_URL;

// Create a dedicated axios instance for wallet service
const walletAxios = axios.create({
  baseURL: walletServiceBaseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Internal-Service": "true",
    "X-Service-Name": "wallet-client",
  },
});

// Add request interceptor for logging
walletAxios.interceptors.request.use((config) => {
  console.log(
    `📤 Wallet service request: ${config.method?.toUpperCase()} ${config.url}`
  );
  return config;
});

// Add response interceptor for better error handling
walletAxios.interceptors.response.use(
  (response) => {
    console.log(
      `📥 Wallet service response: ${response.status} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    console.error(`❌ Wallet service error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export class WalletClient {
  static async lockFundsForOrder(
    clientId: string,
    orderId: string,
    amount: number
  ) {
    try {
      console.log(`🔒 Locking funds for order ${orderId}, amount: ${amount}`);

      const response = await walletAxios.post("/lock-funds", {
        userId: clientId,
        orderId,
        amount,
      });

      console.log("✅ Locked funds response", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💸 Wallet lock failed:", {
        orderId,
        clientId,
        amount,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      // Handle specific error cases
      if (error.response?.status === 429) {
        throw new BadRequestError(
          "Wallet service is temporarily busy. Please try again in a few minutes."
        );
      }

      if (error.response?.status >= 500) {
        throw new BadRequestError(
          "Wallet service is temporarily unavailable. Please try again later."
        );
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new BadRequestError(
          "Wallet service request timed out. Please try again."
        );
      }

      // Use the error message from the service if available
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to lock wallet funds";

      throw new BadRequestError(errorMessage);
    }
  }

  static async releaseFundsToArtisan(orderId: string, artisanId: string) {
    try {
      console.log(
        `💰 Releasing funds for order ${orderId} to artisan ${artisanId}`
      );

      const response = await walletAxios.post("/release-funds", {
        orderId,
        artisanId,
      });

      console.log("✅ Release funds response", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💸 Wallet release failed:", {
        orderId,
        artisanId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      // Handle specific error cases
      if (error.response?.status === 429) {
        throw new BadRequestError(
          "Wallet service is temporarily busy. Please try again in a few minutes."
        );
      }

      if (error.response?.status >= 500) {
        throw new BadRequestError(
          "Wallet service is temporarily unavailable. Please try again later."
        );
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new BadRequestError(
          "Wallet service request timed out. Please try again."
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to release wallet funds";

      throw new BadRequestError(errorMessage);
    }
  }

  static async refundClient(orderId: string, clientId?: string) {
    try {
      console.log(`🔄 Refunding client for order ${orderId}`);

      const response = await walletAxios.post("/refund-funds", {
        orderId,
        clientId,
      });

      console.log("✅ Refund response", response.data);
      return response.data;
    } catch (error: any) {
      console.error("💸 Wallet refund failed:", {
        orderId,
        clientId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });

      // Handle specific error cases
      if (error.response?.status === 429) {
        throw new BadRequestError(
          "Wallet service is temporarily busy. Please try again in a few minutes."
        );
      }

      if (error.response?.status >= 500) {
        throw new BadRequestError(
          "Wallet service is temporarily unavailable. Please try again later."
        );
      }

      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new BadRequestError(
          "Wallet service request timed out. Please try again."
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to refund client";

      throw new BadRequestError(errorMessage);
    }
  }
}
