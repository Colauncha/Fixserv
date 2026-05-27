import axios from "axios";

export class OrderClient {
  private static baseUrl = process.env.ORDER_MANAGEMENT_URL;

  static async getUserLifetimeSpend(userId: string): Promise<{
    totalSpent: number;
    orderCount: number;
    completedOrders: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/orders/internal/lifetime-spend/${userId}`,
        {
          timeout: 5000,
          headers: { "X-Internal-Service": "true" },
        },
      );
      return response.data.data;
    } catch (error: any) {
      console.error(
        `Failed to fetch lifetime spend for ${userId}:`,
        error.message,
      );
      return { totalSpent: 0, orderCount: 0, completedOrders: 0 };
    }
  }

  static async getBulkLifetimeSpend(
    userIds: string[],
  ): Promise<
    Record<
      string,
      { totalSpent: number; orderCount: number; completedOrders: number }
    >
  > {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orders/internal/bulk-lifetime-spend`,
        { userIds },
        {
          timeout: 10000,
          headers: { "X-Internal-Service": "true" },
        },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Failed to fetch bulk lifetime spend:", error.message);
      // Return empty spend for all users on failure
      return userIds.reduce(
        (acc, id) => {
          acc[id] = { totalSpent: 0, orderCount: 0, completedOrders: 0 };
          return acc;
        },
        {} as Record<string, any>,
      );
    }
  }
}
