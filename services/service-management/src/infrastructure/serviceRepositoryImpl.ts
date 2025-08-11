import { BadRequestError } from "@fixserv-colauncha/shared";
import { ServiceAggregate } from "../domain/aggregates/serviceAggregate";
import { Service } from "../domain/entities/service";
import { IServiceRepository } from "../domain/repository/serviceRepository";
import { ServiceDetails } from "../domain/value-objects/serviceDetails";
import { ServiceModel } from "./persistence/model/service";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
import { SkillSet } from "../modules-from-other-services/domain/value-objects/skillSet";

export class ServiceRepositoryImpl implements IServiceRepository {
  async findByArtisanId(artisanId: string): Promise<Service[]> {
    const docs = await ServiceModel.find({ artisanId }).lean();
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
        skillSet: service.skillSet.toArray(),
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<Service | null> {
    const doc = await ServiceModel.findById(id).lean();
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

  async getServices(): Promise<Service[]> {
    const docs = await ServiceModel.find();
    return docs.map(this.toDomain);
  }

  async getPaginatedServices(page: number, limit: number): Promise<Service[]> {
    const skip = (page - 1) * limit;
    const cacheKey = `services:page=${page}:limit=${limit}`;
    await connectRedis();
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData).map(this.toDomain);
    }

    const docs = await ServiceModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    await redis.set(cacheKey, JSON.stringify(docs), {
      EX: 60 * 5, // Cache for 5 mins
    });
    return docs.map(this.toDomain);
  }

  async deleteService(id: string): Promise<void> {
    const result = await ServiceModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new BadRequestError("Service not found");
    }
  }

  async streamAllServices(): Promise<import("mongoose").Cursor<any>> {
    return ServiceModel.find().cursor() as import("mongoose").Cursor<any>;
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
      }
      const result = await ServiceModel.updateOne(
        { _id: id },
        { $set: updateObj, ...(updateObj.$push && { $push: updateObj.push }) }
      );

      if (result.matchedCount === 0) {
        throw new BadRequestError("Service not found");
      }
    } catch (error: any) {
      throw new BadRequestError(`Failed to update service: ${error.message}`);
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
      throw new BadRequestError(
        `Failed to update rating for service ${serviceId}: ${error.message}`
      );
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
      doc.rating,
      SkillSet.create(doc.skillSet || [])
    );
  }
}
