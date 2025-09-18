/*
import axios from "axios";

export class PaystackService {
  static async initializePayment(
    amount: number,
    email: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          amount,
          email,
          metadata: {
            purpose: "Wallet Topup",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data.data);
      return response.data.data.authorization_url;
    } catch (error: any) {
      console.error("Error initializing payment with Paystack:", error);
      throw new Error("Failed to initialize payment");
    }
  }
  static async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await axios.get(
        `${process.env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error verifying payment with Paystack:", error);
      throw new Error("Failed to verify payment");
    }
  }
}
*/

import axios from "axios";

export class PaystackService {
  private static readonly BASE_URL =
    process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
  private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  static async initializePayment(
    amount: number,
    email: string,
    metadata?: any
  ): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      console.log("Initializing payment:", { amount: amount / 100, email });

      const response = await axios.post(
        `${this.BASE_URL}/transaction/initialize`,
        {
          amount,
          email,
          currency: "NGN",
          // callback_url: process.env.FRONTEND_URL
          //   ? `${process.env.FRONTEND_URL}/payment/callback`
          //   : undefined,
          metadata: {
            purpose: "Wallet Topup",
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || "Payment initialization failed"
        );
      }

      const result = response.data.data;
      console.log("Payment initialized successfully:", {
        reference: result.reference,
        authorization_url: result.authorization_url,
      });

      console.log("Wallet service RESULT:", result);

      return {
        authorization_url: result.authorization_url,
        access_code: result.access_code,
        reference: result.reference,
      };
    } catch (error: any) {
      console.error("Error initializing payment with Paystack:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new Error("Invalid Paystack secret key");
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid payment data: ${error.response.data.message}`);
      } else {
        throw new Error(
          "Failed to initialize payment. Please try again later."
        );
      }
    }
  }

  static async verifyPayment(reference: string): Promise<{
    amount: number;
    status: string;
    customer: any;
    channel: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    reference: string;
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      console.log("Verifying payment for reference:", reference);

      const response = await axios.get(
        `${this.BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
          },
          timeout: 15000,
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || "Payment verification failed");
      }

      const result = response.data.data;
      console.log("Payment verification result:", {
        reference: result.reference,
        amount: result.amount / 100,
        status: result.status,
        customer: result.customer.email,
      });

      return result;
    } catch (error: any) {
      console.error("Error verifying payment with Paystack:", {
        reference,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 404) {
        throw new Error(`Payment with reference ${reference} not found`);
      } else if (error.response?.status === 401) {
        throw new Error("Invalid Paystack secret key");
      } else {
        throw new Error("Failed to verify payment. Please try again later.");
      }
    }
  }

  // Initialize transfer (for withdrawals)
  static async initializeTransfer(
    amount: number,
    recipientCode: string,
    reason: string = "Wallet withdrawal"
  ): Promise<{
    transfer_code: string;
    reference: string;
    status: string;
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      console.log("Initializing transfer:", {
        amount: amount / 100,
        recipientCode,
      });

      /*
      const response = await axios.post(
        `${this.BASE_URL}/transfer`,
        {
          source: "balance",
          amount,
          recipient: recipientCode,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || "Transfer initialization failed"
        );
      }

      const result = response.data.data;
      console.log("Transfer initialized successfully:", {
        transfer_code: result.transfer_code,
        reference: result.reference,
      });

      return result;
      */
      return {
        transfer_code: `TRF_mock_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        reference: `REF_mock_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        status: "success",
      };
    } catch (error: any) {
      console.error("Error initializing transfer with Paystack:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new Error(
        error.response?.data?.message ||
          "Failed to initialize transfer. Please try again later."
      );
    }
  }

  // Create transfer recipient
  static async createTransferRecipient(
    accountNumber: string,
    bankCode: string,
    name: string
  ): Promise<{
    recipient_code: string;
    type: string;
    name: string;
    account_number: string;
    bank_name: string;
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      console.log("Creating transfer recipient:", {
        accountNumber,
        bankCode,
        name,
      });

      const response = await axios.post(
        `${this.BASE_URL}/transferrecipient`,
        {
          type: "nuban",
          name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || "Failed to create transfer recipient"
        );
      }

      const result = response.data.data;
      console.log("Transfer recipient created successfully:", {
        recipient_code: result.recipient_code,
        name: result.name,
      });

      return result;
    } catch (error: any) {
      console.error("Error creating transfer recipient:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new Error(
        error.response?.data?.message ||
          "Failed to create transfer recipient. Please check account details."
      );
    }
  }

  // Get list of Nigerian banks
  static async getBanks(): Promise<
    Array<{
      name: string;
      code: string;
      longcode: string;
      gateway: string;
      pay_with_bank: boolean;
      active: boolean;
      country: string;
      currency: string;
      type: string;
    }>
  > {
    try {
      console.log("Fetching list of banks");

      const response = await axios.get(
        `${this.BASE_URL}/bank?country=nigeria`,
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || "Failed to fetch banks");
      }

      console.log(`Fetched ${response.data.data.length} banks`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching banks:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      throw new Error("Failed to fetch banks list. Please try again later.");
    }
  }

  // Resolve account number
  static async resolveAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<{
    account_number: string;
    account_name: string;
    bank_id: number;
  }> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      console.log("Resolving account number:", { accountNumber, bankCode });

      const response = await axios.get(
        `${this.BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error(
          response.data.message || "Failed to resolve account number"
        );
      }

      const result = response.data.data;
      console.log("Account resolved successfully:", {
        account_number: result.account_number,
        account_name: result.account_name,
      });

      return result;
    } catch (error: any) {
      console.error("Error resolving account number:", {
        accountNumber,
        bankCode,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 422) {
        throw new Error("Invalid account number or bank code");
      }

      throw new Error(
        "Failed to resolve account number. Please check the details."
      );
    }
  }

  // Get transaction by reference
  static async getTransaction(reference: string): Promise<any> {
    try {
      if (!this.SECRET_KEY) {
        throw new Error("Paystack secret key not configured");
      }

      const response = await axios.get(
        `${this.BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.SECRET_KEY}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message || "Failed to get transaction");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error getting transaction:", {
        reference,
        message: error.message,
        response: error.response?.data,
      });

      throw new Error("Failed to get transaction details");
    }
  }

  // Health check method
  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.SECRET_KEY) {
        return false;
      }

      // Try to fetch banks as a simple API health check
      await axios.get(`${this.BASE_URL}/bank?country=nigeria&perPage=1`, {
        headers: {
          Authorization: `Bearer ${this.SECRET_KEY}`,
        },
        timeout: 5000,
      });

      return true;
    } catch (error) {
      console.error("Paystack health check failed:", error);
      return false;
    }
  }
}
