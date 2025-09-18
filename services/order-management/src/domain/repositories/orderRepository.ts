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
}
