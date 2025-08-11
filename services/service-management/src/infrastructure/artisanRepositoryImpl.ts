import { ArtisanModel } from "../modules-from-other-services/artisan";
import { IArtisanRepository } from "../domain/repository/artisanRepository";
import { Artisan } from "../modules-from-other-services/domain/entities/artisan";
import { SkillSet } from "../modules-from-other-services/domain/value-objects/skillSet";

export class ArtisanRepositoryImpl implements IArtisanRepository {
  async findById(id: string): Promise<Artisan | null> {
    const doc = await ArtisanModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }
  async exists(id: string): Promise<boolean> {
    const count = await ArtisanModel.countDocuments({ _id: id });
    return count > 0;
  }

  // Add method to get artisan's skillSet
  async getArtisanSkillSet(artisanId: string): Promise<SkillSet | null> {
    const doc = await ArtisanModel.findById(artisanId)
      .select("skillSet")
      .lean();
    if (!doc || !doc.skillSet) return null;
    return SkillSet.create(doc.skillSet);
  }

  private toDomain(doc: any): Artisan {
    return new Artisan(
      doc._id,
      doc.email,
      doc.password,
      doc.fullName,
      doc.businessName,
      doc.location,
      doc.rating,
      doc.skillSet,
      doc.businessHours
    );
  }
}
