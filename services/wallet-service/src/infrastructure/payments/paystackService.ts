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
