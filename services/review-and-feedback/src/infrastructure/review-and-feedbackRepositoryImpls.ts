import { ArtisanModel } from "../modules-from-user-management/artisan";
import { Artisan } from "../modules-from-user-management/domain/entities/artisan";
import { ReviewRepository } from "../domain/repository/reviewRepository";
import { Review } from "../domain/entities/review";
import { ReviewModel } from "./persistence/model/review";
import { Feedback } from "../domain/entities/feedback";
import { Rating } from "../domain/value-objects/rating";

export class reviewAndFeedbackRepositoryImpls implements ReviewRepository {
  async save(review: Review): Promise<void> {
    await ReviewModel.findOneAndUpdate(
      { _id: review.id },
      this.toPersistence(review),
      { upsert: true, new: true }
    ).exec();
  }

  async findById(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findById(id).exec();
    if (!doc) return null;

    return this.toDomain(doc);
  }

  async findByArtisan(artisanId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({ artisanId });
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByService(serviceId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({ serviceId });
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByClient(clientId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({ clientId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }
  async findPublishedByArtisan(artisanId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({ artisanId, status: "published" });
    return docs.map((doc) => this.toDomain(doc));
  }

  async findPublishedByService(serviceId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({
      serviceId,
      status: "published",
    }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

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
  }

  private toDomain(doc: any): Review {
    return new Review(
      doc._id,
      doc.orderId,
      doc.artisanId,
      doc.clientId,
      doc.serviceId,
      new Feedback(doc.feedback.comment),
      new Rating(doc.artisanRating.value, doc.artisanRating.dimensions),
      new Rating(doc.serviceRating.value, doc.serviceRating.dimensions),
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
}
