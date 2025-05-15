import { ServiceAggregate } from "../domain/aggregates/serviceAggregate";
import { Service } from "../domain/entities/service";
import { IServiceRepository } from "../domain/repository/serviceRepository";
import { ServiceDetails } from "../domain/value-objects/serviceDetails";
import { ServiceModel } from "./persistence/model/service";

export class ServiceRepositoryImpl implements IServiceRepository {
  async findByArtisanId(artisanId: string): Promise<Service[]> {
    const docs = await ServiceModel.find({ artisanId });
    return docs.map(this.toDomain);
  }

  async save(service: ServiceAggregate): Promise<void> {
    await ServiceModel.findOneAndUpdate(
      { _id: service.id },
      {
        _id: service.id,
        artisanId: service.artisanId,
        title: service.details.title,
        description: service.details.description,
        price: service.details.price,
        estimatedDuration: service.details.estimatedDuration,
        isActive: service.isActive,
        rating: service.rating,
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<Service | null> {
    const doc = await ServiceModel.findById(id);
    if (!doc) return null;
    return this.toDomain(doc);
  }

  // async findByArtisanId(artisanId: string): //Promise<ServiceAggregate[]> {
  //   const docs = await ServiceModel.find({ //artisanId });
  //   return docs.map(this.toDomain);
  // }

  async activateService(id: string): Promise<void> {
    await ServiceModel.updateOne({ _id: id }, { isActive: true });
  }

  async deactivateService(id: string): Promise<void> {
    await ServiceModel.updateOne({ _id: id }, { isActive: false });
  }

  async updateService(
    id: string,
    updates: {
      title?: string;
      description?: string;
      price?: number;
      estimatedDuration?: string;
      isActive?: boolean;
      rating?: number;
    }
  ): Promise<void> {
    try {
      const updateObj: any = {};

      if (updates.title !== undefined) updateObj.title = updates.title;
      if (updates.description !== undefined)
        updateObj.description = updates.description;
      if (updates.price !== undefined) updateObj.price = updates.price;
      if (updates.estimatedDuration !== undefined)
        updateObj.estimatedDuration = updates.estimatedDuration;
      if (updates.isActive !== undefined) updateObj.isActive = updates.isActive;
      if (updates.rating !== undefined) {
        updateObj.rating = updates.rating;
        updateObj.$push = {
          ratingHistory: {
            rating: updates.rating,
            updatedAt: new Date(),
          },
        };
        const result = await ServiceModel.updateOne(
          { _id: id },
          { $set: updateObj }
        );

        if (result.matchedCount === 0) {
          throw new Error("Service not found");
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to update service: ${error.message}`);
    }
  }

  async updateRating(serviceId: string, newRating: number): Promise<void> {
    try {
      await ServiceModel.findOneAndUpdate(
        { _id: serviceId },
        {
          $set: { rating: newRating },
          $push: {
            ratingHistory: {
              rating: newRating,
              updatedAt: new Date(),
            },
          },
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to update rating for service ${serviceId}: 
      ${error.message}`);
    }
  }

  private toDomain(doc: any): Service {
    return new Service(
      doc._id,
      doc.artisanId,
      new ServiceDetails(
        doc.title,
        doc.description,
        doc.price,
        doc.estimatedDuration
      ),
      doc.isActive,
      doc.rating
    );
  }
}
