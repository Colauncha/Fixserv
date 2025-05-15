import { Service } from "../entities/service";

export interface IServiceRepository {
  save(service: Service): Promise<void>;
  findById(id: string): Promise<Service | null>;
  findByArtisanId(artisanId: string): Promise<Service[]>;
  activateService(id: string): Promise<void>;
  deactivateService(id: string): Promise<void>;
  updateService(
    id: string,
    updates: {
      title?: string;
      description?: string;
      price?: number;
      estimatedDuration?: string;
      isActive?: boolean;
      rating?: number;
    }
  ): Promise<void>;
}
