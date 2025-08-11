import { BaseService } from "../domain/entities/baseService";
import { IBaseServiceRepository } from "../domain/repository/baseServiceRepository";
import { BaseServiceModel } from "./persistence/model/baseService";

export class BaseServiceRepositoryImpl implements IBaseServiceRepository {
  async createBaseService(service: BaseService): Promise<void> {
    await BaseServiceModel.create({
      _id: service.id,
      title: service.title,
      description: service.description,
      createdBy: service.createdBy,
      isActive: service.isActive,
    });
  }

  async findById(id: string): Promise<BaseService | null> {
    const doc = await BaseServiceModel.findById(id).lean();
    if (!doc) return null;
    return new BaseService(
      doc._id,
      doc.title,
      doc.description,
      doc.createdBy,
      doc.isActive
    );
  }

  async getAll(): Promise<BaseService[]> {
    const docs = await BaseServiceModel.find().lean();
    return docs.map(
      (doc) =>
        new BaseService(
          doc._id,
          doc.title,
          doc.description,
          doc.createdBy,
          doc.isActive
        )
    );
  }

  async delete(id: string): Promise<void> {
    await BaseServiceModel.deleteOne({ _id: id });
  }
}
