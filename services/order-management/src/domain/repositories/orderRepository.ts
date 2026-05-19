import { Order } from "../entities/order";

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByClientId(clientId: string, status?: string): Promise<Order[]>;
  findByArtisanId(artisanId: string, status?: string): Promise<Order[]>;
  update(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
  findPublicOrders(): Promise<Order[]>;

  // New methods for artisan response feature
  findExpiredPendingOrders(): Promise<Order[]>;
  findPendingOrdersForArtisan(artisanId: string): Promise<Order[]>;
  getGMV(
    period: "today" | "week" | "month" | "all",
  ): Promise<{ total: number; period: string; orderCount: number }>;
  getTransactionStats(period: "today" | "week" | "month"): Promise<{
    period: string;
    total: number;
    completed: number;
    pending: number;
    rejected: number;
    cancelled: number;
    inProgress: number;
    totalValue: number;
    completedValue: number;
    averageOrderValue: number;
  }>;
  getRevenueBreakdown(): Promise<{
    daily: { date: string; value: number; count: number }[];
    weekly: { week: string; value: number; count: number }[];
  }>;

  resolveDispute(
    orderId: string,
    resolution: "REFUND_CLIENT" | "RELEASE_TO_ARTISAN",
    adminId: string,
    note?: string,
  ): Promise<Order>;

  getDisputeStats(): Promise<{
    total: number;
    open: number;
    resolved: number;
    disputedOrders: any[];
  }>;
}
