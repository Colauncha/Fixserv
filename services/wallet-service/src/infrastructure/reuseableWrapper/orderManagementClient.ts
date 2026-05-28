import axios from "axios";

export class OrderClient {
  private static baseUrl =
    process.env.ORDER_MANAGEMENT_URL || "http://fixserv-order:4004";

  static async getBulkOrderDetails(orderIds: string[]): Promise<
    Record<
      string,
      {
        clientId: string;
        artisanId: string;
        serviceId: string;
        price: number;
        status: string;
        item: string;
        createdAt: Date;
      }
    >
  > {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/orders/internal/bulk-order-details`,
        { orderIds },
        {
          timeout: 10000,
          headers: { "X-Internal-Service": "true" },
        },
      );

      const orderMap: Record<string, any> = {};
      (response.data.data || []).forEach((order: any) => {
        orderMap[order._id] = {
          clientId: order.clientId,
          artisanId: order.artisanId,
          serviceId: order.serviceId,
          price: order.price,
          status: order.status,
          // Use uploadedProducts description as item name
          item: order.uploadedProducts?.[0]?.objectName || "Service",
          createdAt: order.createdAt,
        };
      });

      console.log(orderMap);

      return orderMap;
    } catch (error: any) {
      console.error("Failed to fetch bulk order details:", error.message);
      return {};
    }
  }
}
