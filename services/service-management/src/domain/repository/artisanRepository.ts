import { Artisan } from "../../modules-from-other-services/domain/entities/artisan";

export interface IArtisanRepository {
  findById(id: string): Promise<Artisan | null>;
  exists(id: string): Promise<boolean>;
}
