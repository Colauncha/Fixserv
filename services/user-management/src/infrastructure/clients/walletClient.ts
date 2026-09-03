import axios, { AxiosInstance } from "axios";

export class WalletClient {
  private static httpClient: AxiosInstance = axios.create({
    baseURL: process.env.WALLET_SERVICE_URL, // e.g. http://wallet-service-srv:4005
    timeout: 8000,
    headers: {
      "X-Internal-Service": "true",
      "Content-Type": "application/json",
    },
  });

  // Fetches the user's referral code from wallet-service
  static async getReferralCode(userId: string,token:string): Promise<{
    code: string;
    userType: string;
    usageCount: number;
  } | null> {
    try {
      const response = await this.httpClient.get(
        `/api/wallet/referral/info/${userId}`,
        {
          headers:{
           Authorization: `Bearer ${token}`,
          }
        }
      );

      const referralCode = response.data?.data?.myReferralCode;
      if (!referralCode) return null;

      return {
        code: referralCode,
        userType: response.data?.data?.userType ?? "",
        usageCount: response.data?.data?.totalReferrals ?? 0,
      };
    } catch (error: any) {
      // Non-fatal — if wallet-service is down, QR generation fails gracefully
      console.error(
        `Failed to fetch referral code for user ${userId}:`,
        error.message,
      );
      return null;
    }
  }
}
