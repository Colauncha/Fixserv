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
import { safeAxiosCall } from "../clients/axiosClient";
import { makeServiceCall } from "./getUserProfile";

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
  // static async lockFundsForOrder(
  //   clientId: string,
  //   orderId: string,
  //   amount: number
  // ) {
  //   try {
  //     console.log(`🔒 Locking funds for order ${orderId}, amount: $//{amount}`);
  //
  //     const response = await walletAxios.post("/lock-funds", {
  //       userId: clientId,
  //       orderId,
  //       amount,
  //     });
  //
  //     console.log("✅ Locked funds response", response.data);
  //     return response.data;
  //   } catch (error: any) {
  //     console.error("💸 Wallet lock failed:", {
  //       orderId,
  //       clientId,
  //       amount,
  //       error: error.response?.data || error.message,
  //       status: error.response?.status,
  //     });
  //
  //     // Handle specific error cases
  //     if (error.response?.status === 429) {
  //       throw new BadRequestError(
  //         "Wallet service is temporarily busy. Please try again in a few //minutes."
  //       );
  //     }
  //
  //     if (error.response?.status >= 500) {
  //       throw new BadRequestError(
  //         "Wallet service is temporarily unavailable. Please try again //later."
  //       );
  //     }
  //
  //     if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
  //       throw new BadRequestError(
  //         "Wallet service request timed out. Please try again."
  //       );
  //     }
  //
  //     // Use the error message from the service if available
  //     const errorMessage =
  //       error.response?.data?.message ||
  //       error.response?.data?.errors?.[0]?.message ||
  //       "Failed to lock wallet funds";
  //
  //     throw new BadRequestError(errorMessage);
  //   }
  // }

  static async lockFundsForOrder(
    clientId: string,
    orderId: string,
    amount: number
  ) {
    try {
      console.log(
        `🔒 Locking funds for order ${orderId}, client ${clientId}, amount: ${amount}`
      );

      const result = await safeAxiosCall({
        method: "post",
        url: `${process.env.WALLET_SERVICE_URL}/lock-funds`,
        data: {
          userId: clientId,
          orderId,
          amount,
        },
      });

      if (result.success) {
        console.log(`✅ Successfully locked funds for order: ${orderId}`);
        return result.data;
      }

      const error: any = result.error;

      if (error.status === 429) {
        console.warn(`⚠️ Rate limited when locking funds for order ${orderId}`);
        // For wallet operations, we might want to retry after a longer delay
        throw new BadRequestError(
          "Wallet service is currently busy. Please try again in a few moments."
        );
      }

      if (error.status === 400) {
        console.warn(
          `⚠️ Bad request when locking funds for order ${orderId}:`,
          error.data
        );
        throw new BadRequestError(
          error.data?.message || "Invalid request to lock funds"
        );
      }

      if (error.status >= 500) {
        console.warn(`⚠️ Wallet service error for order ${orderId}`);
        throw new BadRequestError(
          "Wallet service is temporarily unavailable. Please try again later."
        );
      }

      console.warn(
        `⚠️ Unknown error when locking funds for order ${orderId}:`,
        error
      );

      throw new BadRequestError(
        "Unable to lock wallet funds. Please try again later."
      );
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      console.error(
        `❌ Unexpected error locking funds for order ${orderId} (service continues):`,
        error
      );
      throw new BadRequestError(
        "An unexpected error occurred while processing wallet operation. Please try again later."
      );
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
  /*
  static async getTransactionHistory(clientId: string): Promise<any> {
    try {
      console.log(`📜 Fetching transaction history for client ${clientId}`);

      const result = await safeAxiosCall({
        method: "get",
        url: `${process.env.WALLET_SERVICE_URL}/get-transaction/${clientId}`,
      });
      if (result.success) {
        console.log(
          `✅ Successfully got transaction history  for : ${clientId}`
        );
        return result.data;
      }
      //const response = await walletAxios.get(`///transaction-history/${clientId}`);
      //
      //console.log("✅ Transaction history response", //response.data);
      //return response.data;
    } catch (error: any) {
      console.error("💸 Wallet transaction history fetch failed:", {
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
        "Failed to fetch transaction history";

      throw new BadRequestError(errorMessage);
    }
  }
    */
  static async getTransactionHistory(clientId: string): Promise<any> {
    return makeServiceCall(
      {
        method: "get",
        url: `${process.env.WALLET_SERVICE_URL}/get-transaction/${clientId}`,
      },
      "Wallet Transaction History",
      clientId,
      true // Requires database connection
    );
  }
}
