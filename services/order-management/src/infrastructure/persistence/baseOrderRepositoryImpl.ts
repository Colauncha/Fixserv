import { BaseOrder } from "../../domain/entities/baseOrder";
import { BaseOrderModel, BaseOrderDocument } from "./models/baseOrder";
import { IBaseOrderRepository } from "../../domain/repositories/baseOrderRepository";

export class BaseOrderRepositoryImpl implements IBaseOrderRepository {
  async create(order: BaseOrder): Promise<void> {
    await BaseOrderModel.create(order);
  }

  async findById(id: string): Promise<BaseOrder | null> {
    const doc = await BaseOrderModel.findOne({ id })
      .lean<BaseOrderDocument>()
      .exec();
    return doc
      ? new BaseOrder(
          doc.id,
          doc.clientId,
          doc.artisanId,
          doc.offeredServiceId,
          doc.baseServiceId,
          doc.price,
          doc.status,
          doc.createdAt
        )
      : null;
  }

  async getAllByClient(clientId: string): Promise<BaseOrder[]> {
    const docs = await BaseOrderModel.find({ clientId })
      .lean<BaseOrderDocument[]>()
      .exec();
    return docs.map(
      (doc) =>
        new BaseOrder(
          doc.id,
          doc.clientId,
          doc.artisanId,
          doc.offeredServiceId,
          doc.baseServiceId,
          doc.price,
          doc.status,
          doc.createdAt
        )
    );
  }
}
