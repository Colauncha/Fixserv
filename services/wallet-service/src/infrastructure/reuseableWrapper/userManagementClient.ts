import axios from "axios";
import { BadRequestError } from "@fixserv-colauncha/shared";

export class UserManagementClient {
  private static baseUrl = process.env.USER_MANAGEMENT_URL;

  static async verifyPassword(
    userId: string,
    password: string,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/verify-password`,
        { userId, password },
        {
          timeout: 10000,
          headers: {
            "X-Internal-Service": "true",
            "X-Service-Name": "wallet-service",
          },
        },
      );
      return response.data.isValid === true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new BadRequestError("User not found");
      }
      console.error("Error verifying password:", error.message);
      throw new BadRequestError("Unable to verify password. Please try again.");
    }
  }

  static async getBulkUserDetails(
    userIds: string[],
  ): Promise<
    Record<
      string,
      { fullName: string; email: string; role: string; businessName?: string }
    >
  > {
    try {
      const uniqueIds = [...new Set(userIds)]; // deduplicate
      const response = await axios.post(
        `${this.baseUrl}/internal/bulk-user-details`,
        { userIds: uniqueIds },
        {
          timeout: 10000,
          headers: { "X-Internal-Service": "true" },
        },
      );
      console.log("user", response.data.data);
      return response.data.data || {};
    } catch (error: any) {
      console.error("Failed to fetch bulk user details:", error.message);
      return {};
    }
  }
}
