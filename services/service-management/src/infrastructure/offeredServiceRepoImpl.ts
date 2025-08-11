import { BadRequestError } from "@fixserv-colauncha/shared";
import { OfferedService } from "../domain/entities/offeredService";
import { IOfferedServiceRepository } from "../domain/repository/offeredServiceRepository";
import { OfferedServiceModel } from "./persistence/model/offeredService";

export class OfferedServiceRepositoryImpl implements IOfferedServiceRepository {
  async create(offeredService: OfferedService): Promise<void> {
    await OfferedServiceModel.create({
      _id: offeredService.id,
      artisanId: offeredService.artisanId,
      baseServiceId: offeredService.baseServiceId,
      price: offeredService.price,
      estimatedDuration: offeredService.estimatedDuration,
      rating: offeredService.rating,
      skillSet: offeredService.skillSet,
      isActive: offeredService.isActive,
    });
  }

  async findById(id: string): Promise<OfferedService | null> {
    const doc = await OfferedServiceModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByArtisanId(artisanId: string): Promise<OfferedService[]> {
    const docs = await OfferedServiceModel.find({ artisanId }).lean();
    return docs.map(
      (doc) =>
        new OfferedService(
          doc._id,
          doc.artisanId,
          doc.baseServiceId,
          doc.price,
          doc.estimatedDuration,
          doc.rating,
          doc.skillSet,
          doc.isActive
        )
    );
  }

  async findByBaseServiceId(baseServiceId: string): Promise<OfferedService[]> {
    const docs = await OfferedServiceModel.find({ baseServiceId }).lean();
    return docs.map(
      (doc) =>
        new OfferedService(
          doc._id,
          doc.artisanId,
          doc.baseServiceId,
          doc.price,
          doc.estimatedDuration,
          doc.rating,
          doc.skillSet,
          doc.isActive
        )
    );
  }

  async findByArtisanAndBaseService(
    artisanId: string,
    baseServiceId: string
  ): Promise<OfferedService | null> {
    const docs = await OfferedServiceModel.find({
      artisanId,
      baseServiceId,
    }).lean();

    if (docs.length === 0) {
      return null;
    }

    console.log(docs);
    return new OfferedService(
      docs[0]._id,
      docs[0].artisanId,
      docs[0].baseServiceId,
      docs[0].price,
      docs[0].estimatedDuration,
      docs[0].rating,
      docs[0].skillSet,
      docs[0].isActive
    );
  }
  private toDomain(docs: any): OfferedService {
    return new OfferedService(
      docs._id,
      docs.artisanId,
      docs.baseServiceId,
      docs.price,
      docs.estimatedDuration,
      docs.rating,
      docs.skillSet,
      docs.isActive
    );
  }
}
