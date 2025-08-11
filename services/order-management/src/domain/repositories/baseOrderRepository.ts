import { BaseOrder } from "../entities/baseOrder";

export interface IBaseOrderRepository {
  create(order: BaseOrder): Promise<void>;
  findById(id: string): Promise<BaseOrder | null>;
  getAllByClient(clientId: string): Promise<BaseOrder[]>;
}
