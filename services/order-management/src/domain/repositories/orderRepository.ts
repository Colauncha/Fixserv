import { Order, OrderStatus, PaymentStatus } from "../entities/order";

export interface OrderRepository {
  findById(orderId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findByClientId(clientId: string): Promise<Order[]>;
  findByArtisanId(artisanId: string): Promise<Order[]>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
  updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<void>;
}
