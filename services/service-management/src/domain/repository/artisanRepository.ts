import { Artisan } from "../../modules-from-user-management/domain/entities/artisan";

export interface IArtisanRepository {
  findById(id: string): Promise<Artisan | null>;
  exists(id: string): Promise<boolean>;
}
