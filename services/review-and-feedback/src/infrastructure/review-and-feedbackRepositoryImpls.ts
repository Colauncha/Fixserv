import { ArtisanModel } from "../modules-from-user-management/artisan";
import { Artisan } from "../modules-from-user-management/domain/entities/artisan";
import { ReviewRepository } from "../domain/repository/reviewRepository";
import { Review } from "../domain/entities/review";
import { ReviewModel } from "./persistence/model/review";
import { Feedback } from "../domain/entities/feedback";
import { Rating } from "../domain/value-objects/rating";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
import type { FilterQuery } from "mongoose";
import { ReviewDto } from "../domain/dtos/reviewDto";

export class reviewAndFeedbackRepositoryImpls implements ReviewRepository {
  async save(review: Review): Promise<void> {
    await ReviewModel.updateOne(
      { _id: review.id },
      this.toPersistence(review),
      { upsert: true }
    );
    await this.invalidateCaches(review);
  }

  async findAll(page?: number, limit?: number): Promise<Review[]> {
    return this.query({}, { page, limit });
  }
  async findById(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findById(id, this.projection).lean();
    if (!doc) return null;

    return this.toDomain(doc);
  }

  async findByArtisan(
    artisanId: string,
    page?: number,
    limit?: number
  ): Promise<Review[]> {
    // const docs = await ReviewModel.find({ artisanId });
    // return docs.map((doc) => this.toDomain(doc));
    return this.query({ artisanId }, { page, limit });
  }

  async findByService(
    serviceId: string,
    page?: number,
    limit?: number
  ): Promise<Review[]> {
    // const docs = await ReviewModel.find({ serviceId });
    // return docs.map((doc) => this.toDomain(doc));
    return this.query({ serviceId }, { page, limit });
  }

  async findByClient(
    clientId: string,
    page?: number,
    limit?: number
  ): Promise<Review[]> {
    // const docs = await ReviewModel.find({ clientId }).exec();
    // return docs.map((doc) => this.toDomain(doc));
    return this.query({ clientId }, { page, limit });
  }

  // async findPublishedByArtisan(artisanId: string): Promise<Review[]> {
  // // const docs = await ReviewModel.find({ artisanId, status: "published" });
  // return docs.map((doc) => this.toDomain(doc));
  // }

  async findPublishedByArtisan(
    artisanId: string,
    page?: number,
    limit?: number
  ): Promise<Review[]> {
    const pageNumber = page || 1;
    const limitNumber = limit || 20;
    const key = `artisan:${artisanId}:published:v1:${pageNumber}:${limitNumber}`;
    await connectRedis();
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData).map((dto: ReviewDto) =>
        this.dtoToDomain(dto)
      );
    }
    const result = await this.query(
      { artisanId, status: "published" },
      { page, limit }
    );

    const dtoList = result.map((r) => r.toDto());

    if (dtoList.length) {
      await redis.setEx(key, 60, JSON.stringify(dtoList));
    }
    return result;
  }

  async findPublishedByService(
    serviceId: string,
    page?: number,
    limit?: number
  ): Promise<Review[]> {
    const pageNumber = page || 1;
    const limitNumber = limit || 20;
    const key = `service:${serviceId}:published:v1:${pageNumber}:${limitNumber}`;
    await connectRedis();
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData).map((dto: ReviewDto) =>
        this.dtoToDomain(dto)
      );
    }
    const result = await this.query(
      { serviceId, status: "published" },
      { page, limit }
    );
    const dtoList = result.map((r) => r.toDto());
    if (dtoList.length) {
      await redis.setEx(key, 60, JSON.stringify(dtoList));
    }
    return result;
  }

  /*
  async getAverageArtisanRating(artisanId: string): Promise<number> {
    const result = await ReviewModel.aggregate([
      { $match: { artisanId, status: "published" } },
      { $group: { _id: null, avgRating: { $avg: "$artisanRating.value" } } },
    ]).exec();

    return result[0]?.avgRating || 0;
  }

  async getAverageServiceRating(serviceId: string): Promise<number> {
    const result = await ReviewModel.aggregate([
      { $match: { serviceId, status: "published" } },
      { $group: { _id: null, avgRating: { $avg: "$serviceRating.value" } } },
    ]).exec();

    return result[0]?.avgRating || 0;
  }
    */

  async getAverageArtisanRating(artisanId: string): Promise<number> {
    const key = `avg:artisan:${artisanId}:v1`;
    await connectRedis();
    const cachedData = await redis.get(key);
    if (cachedData) {
      return parseFloat(cachedData);
    }
    const [res] = await ReviewModel.aggregate([
      { $match: { artisanId, status: "published" } },
      { $group: { _id: null, avgRating: { $avg: "$artisanRating.value" } } },
    ]);
    const avgRating = res?.avgRating || 0;
    await redis.setEx(key, 120, avgRating.toString());
    return avgRating;
  }

  async getAverageServiceRating(serviceId: string): Promise<number> {
    const key = `avg:service:${serviceId}:v1`;
    await connectRedis();
    const cachedData = await redis.get(key);
    if (cachedData) {
      return parseFloat(cachedData);
    }
    const [res] = await ReviewModel.aggregate([
      { $match: { serviceId, status: "published" } },
      { $group: { _id: null, avgRating: { $avg: "$serviceRating.value" } } },
    ]);
    const avgRating = res?.avgRating || 0;
    await redis.setEx(key, 120, avgRating.toString());
    return avgRating;
  }

  async update(review: Review): Promise<void> {
    await ReviewModel.updateOne(
      {
        _id: review.id,
      },
      {
        $set: {
          feedback: {
            comment: review.feedback.comment,
            moderationNotes: review.feedback.moderationNotes,
            attachments: review.feedback.attachments,
          },
          artisanRating: {
            value: review.artisanRating.value,
            dimensions: review.artisanRating.dimensions,
          },
          serviceRating: {
            value: review.serviceRating.value,
            dimensions: review.serviceRating.dimensions,
          },
          status: review.status,
          updatedAt: new Date(),
        },
      }
    );
    await this.invalidateCaches(review);
  }

  async delete(id: string): Promise<void> {
    const review = await this.findById(id);
    if (!review) return;

    await this.invalidateCaches(review);
    await ReviewModel.deleteOne({ _id: id });
  }

  private toDomain(doc: any): Review {
    const rawFeedback = doc.feedback ?? {
      comment: "Default comment",
      moderationNotes: [],
      attachments: [],
    };
    const rawArtisanRating = doc.artisanRating ?? {};
    const rawServiceRating = doc.serviceRating ?? {};
    const feedback = new Feedback(rawFeedback.comment);
    rawFeedback.moderationNotes.forEach((note: string) =>
      feedback.addModerationNote(note)
    );
    rawFeedback.attachments.forEach((attachment: string) =>
      feedback.addAttachment(attachment)
    );
    const artisanRating = new Rating(
      typeof rawArtisanRating.value === "number" &&
      rawArtisanRating.value >= 1 &&
      rawArtisanRating.value <= 5
        ? rawArtisanRating.value
        : 1,
      rawArtisanRating.dimensions ?? []
    );
    const serviceRating = new Rating(
      typeof rawServiceRating.value === "number" &&
      rawServiceRating.value >= 1 &&
      rawServiceRating.value <= 5
        ? rawServiceRating.value
        : 1,
      rawServiceRating.dimensions ?? []
    );
    return new Review(
      doc._id,
      doc.orderId,
      doc.artisanId,
      doc.clientId,
      doc.serviceId,
      feedback,
      artisanRating,
      serviceRating,
      doc.status,
      doc.createdAt
    );
  }

  private toPersistence(review: Review): any {
    return {
      _id: review.id,
      orderId: review.orderId,
      artisanId: review.artisanId,
      clientId: review.clientId,
      serviceId: review.serviceId,
      feedback: {
        comment: review.feedback.comment,
        moderationNotes: review.feedback.moderationNotes,
        attachments: review.feedback.attachments,
      },
      artisanRating: {
        value: review.artisanRating.value,
        dimensions: review.artisanRating.dimensions,
      },
      serviceRating: {
        value: review.serviceRating.value,
        dimensions: review.serviceRating.dimensions,
      },
      status: review.status,
      createdAt: review.date,
    };
  }

  async scanAndDelete(pattern: string) {
    // use SCAN to avoid blocking Redis on large keyspaces
    let cursor = "0";
    do {
      const { cursor: next, keys } = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = next;
      if (keys.length) await redis.del(keys);
    } while (cursor !== "0");
  }

  private async invalidateCaches(review: Review) {
    await Promise.all([
      this.scanAndDelete(`artisan:${review.artisanId}:published:v1:*`),
      this.scanAndDelete(`service:${review.serviceId}:published:v1:*`),
      redis.del(`avg:artisan:${review.artisanId}:v1`),
      redis.del(`avg:service:${review.serviceId}:v1`),
    ]);
  }

  private projection = {
    _id: 1,
    orderId: 1,
    artisanId: 1,
    clientId: 1,
    serviceId: 1,
    feedback: 1,
    artisanRating: 1,
    serviceRating: 1,
    status: 1,
    createdAt: 1,
  };

  private async query(filter: FilterQuery<any>, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const docs = await ReviewModel.find(filter, this.projection)
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return docs.map(this.toDomain);
  }
  private dtoToDomain(dto: ReviewDto): Review {
    return new Review(
      dto.id,
      dto.orderId,
      dto.artisanId,
      dto.clientId,
      dto.serviceId,
      new Feedback(dto.comment),
      new Rating(dto.artisanRating, dto.ratingDimensions),
      new Rating(dto.serviceRating, dto.ratingDimensions),
      dto.status as any,
      new Date(dto.date)
    );
  }
}
