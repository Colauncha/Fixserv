import { BaseService } from "../entities/baseService";

export interface IBaseServiceRepository {
  createBaseService(service: BaseService): Promise<void>;
  findById(id: string): Promise<BaseService | null>;
  getAll(): Promise<BaseService[]>;
  delete(id: string): Promise<void>;
}
