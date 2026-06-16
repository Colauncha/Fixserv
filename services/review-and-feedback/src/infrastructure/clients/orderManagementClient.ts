import { AxiosInstance } from "axios";

export interface OrderDetails {
  exists: boolean;
  orderId?: string;
  clientId?: string;
  artisanId?: string;
  serviceId?: string;
  status?: string;
  isCompleted?: boolean;
}

export class OrderManagementClient {
  constructor(private httpClient: AxiosInstance) {}

  async getOrder(orderId: string, token: string): Promise<OrderDetails> {
    try {
      const response = await this.httpClient.get(`/${orderId}/getOrder`, {
        headers: {
          Authorization: token,
        },
      });
      const order = response.data;
      return {
        exists: true,
        orderId: order.id ?? order.orderId,
        clientId: order.clientId,
        artisanId: order.artisanId,
        serviceId: order.serviceId,
        status: order.status,
        // Only completed orders can be reviewed
        isCompleted: order.status === "COMPLETED",
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  // Validate that this order belongs to the given client, artisan, and service
  async validateOrderOwnership(
    orderId: string,
    clientId: string,
    artisanId: string,
    serviceId: string,
    token: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      const order = await this.getOrder(orderId, token);

      if (!order.exists)
        return { valid: false, reason: "Order does not exist" };
      if (order.clientId !== clientId)
        return { valid: false, reason: "Order does not belong to this client" };
      if (order.artisanId !== artisanId)
        return {
          valid: false,
          reason: "Order was not fulfilled by this artisan",
        };
      if (order.serviceId !== serviceId)
        return { valid: false, reason: "Order is not for this service" };
      if (!order.isCompleted)
        return {
          valid: false,
          reason: "Only completed orders can be reviewed",
        };

      return { valid: true };
    } catch (error: any) {
      throw new Error(`Order validation failed: ${error.message}`);
    }
  }
}
