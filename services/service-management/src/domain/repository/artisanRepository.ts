import { Artisan } from "../../modules-from-other-services/domain/entities/artisan";
import { SkillSet } from "../../modules-from-other-services/domain/value-objects/skillSet";

export interface IArtisanRepository {
  findById(id: string): Promise<Artisan | null>;
  exists(id: string): Promise<boolean>;
  getArtisanSkillSet(artisanId: string): Promise<SkillSet | null>; // Add this method
}
