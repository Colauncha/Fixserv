import { ArtisanModel } from "../modules-from-user-management/artisan";
import { IArtisanRepository } from "../domain/repository/artisanRepository";
import { Artisan } from "../modules-from-user-management/domain/entities/artisan";

export class ArtisanRepositoryImpl implements IArtisanRepository {
  async findById(id: string): Promise<Artisan | null> {
    const doc = await ArtisanModel.findById(id);
    if (!doc) return null;
    return this.toDomain(doc);
  }
  async exists(id: string): Promise<boolean> {
    const count = await ArtisanModel.countDocuments({ _id: id });
    return count > 0;
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
