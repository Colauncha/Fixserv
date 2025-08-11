import { Order } from "../entities/order";

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByClientId(clientId: string): Promise<Order[]>;
  findByArtisanId(artisanId: string): Promise<Order[]>;
  update(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
  findPublicOrders(): Promise<Order[]>;
}
