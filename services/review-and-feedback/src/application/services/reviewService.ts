import { BadRequestError } from "@fixserv-colauncha/shared";
import { v4 as uuidv4 } from "uuid";

import { RedisEventBus } from "@fixserv-colauncha/shared";

import { Review } from "../../domain/entities/review";
import { ReviewRepository } from "../../domain/repository/reviewRepository";
import { Feedback } from "../../domain/entities/feedback";
import { Rating } from "../../domain/value-objects/rating";
import { UserManagementClient } from "../../infrastructure/clients/userManagementClient";
import { ServiceManagementClient } from "../../infrastructure/clients/serviceManagementClient";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { EventAck } from "@fixserv-colauncha/shared";
import {
  ReviewCreatedEvent,
  ReviewUpdatedEvent,
} from "../../events/reviewEvents";
import { ReviewPublishedEvent } from "../../events/reviewPublishedEvent";
import { clearPublishedCache } from "../../infrastructure/utils/clearPublishedCache";

export class ReviewService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private processingReviews = new Map<string, Promise<EventAck | void>>();
  constructor(
    private reviewRepository: ReviewRepository,
    private ratingCalculator?: RatingCalculator,

    private userManagementClient?: UserManagementClient,
    private serviceManagementClient?: ServiceManagementClient
  ) {}

  async submitReview(
    orderId: string,
    artisanId: string,
    clientId: string,
    serviceId: string,
    feedback: Feedback,
    artisanRating: Rating,
    serviceRating: Rating
  ): Promise<Review> {
    await this.validateReferences(artisanId, clientId, serviceId);
    const review = Review.create(
      uuidv4(),
      orderId,
      artisanId,
      clientId,
      serviceId,
      feedback,
      artisanRating,
      serviceRating
    );

    await this.reviewRepository.save(review);

    this.processingReviews.set(
      review.id,
      this.processReview(review).catch((err) =>
        console.error(`Processing failed for review ${review.id}:`, err)
      )
    );

    return review;
  }
  private async processReview(review: Review): Promise<void> {
    try {
      review.markAsProcessing();
      await this.reviewRepository.save(review);

      const ackPromise = this.waitForProcessingAck(
        review.id,
        ["user-management", "service-management"],
        15000
      );

      await this.eventBus.publish(
        "review_events",
        new ReviewCreatedEvent({
          reviewId: review.id,
          artisanId: review.artisanId,
          serviceId: review.serviceId,
          clientId: review.clientId,
          artisanRating: review.artisanRating.value,
          serviceRating: review.serviceRating.value,
          // status: review.status,
        })
      );
      console.log(`Published ReviewCreatedEvent for ${review.id}`);

      const ackResult = await ackPromise;

      if (ackResult.success) {
        review.markAsPublished();
        await this.reviewRepository.save(review);

        await clearPublishedCache(review.artisanId, review.serviceId);

        await this.eventBus.publish(
          "review_events",
          new ReviewPublishedEvent({
            reviewId: review.id,
            artisanId: review.artisanId,
            serviceId: review.serviceId,
            clientId: review.clientId,
            artisanRating: review.artisanRating.value,
            serviceRating: review.serviceRating.value,
          })
        );
      } else {
        review.markAsFailed(ackResult.error ?? "Processing failed");
        await this.reviewRepository.save(review);
      }
    } catch (error: any) {
      review.markAsFailed(error.message);
      await this.reviewRepository.save(review);
      throw error;
    } finally {
      this.processingReviews.delete(review.id);
    }
  }

  private async waitForProcessingAck(
    reviewEventId: string,
    requiredServices: string[],
    timeoutMs = 10000
  ): Promise<{ success: boolean; error?: string; service?: string }> {
    return new Promise(async (resolve) => {
      const receivedAcks: Record<string, { success: boolean; error?: string }> =
        {};

      const subscription = await this.eventBus.subscribe(
        "event_acks",
        (ack: EventAck) => {
          if (ack.originalEventId !== reviewEventId) return;
          const service = ack.service;
          if (!requiredServices.includes(service)) return;

          receivedAcks[service] = {
            success: ack.status === "processed",
            error: ack.error,
          };

          const allResponded = requiredServices.every(
            (svc) => receivedAcks[svc] !== undefined
          );

          if (allResponded) {
            subscription.unsubscribe();
            const allSuccessful = requiredServices.every(
              (svc) => receivedAcks[svc].success
            );

            console.log("Receieved Ack:", ack);
            resolve({
              success: allSuccessful,
              error: allSuccessful
                ? undefined
                : Object.values(receivedAcks).find((r) => !r.success)?.error,
              service: allSuccessful
                ? undefined
                : requiredServices.find((svc) => !receivedAcks[svc].success),
            });
          }
          if (ack.status === "failed") {
            subscription.unsubscribe();
            resolve({
              success: false,
              error: ack.error,
              service,
            });
          }
        }
      );
      setTimeout(() => {
        subscription.unsubscribe();
        const missing = requiredServices.filter((svc) => !receivedAcks[svc]);
        resolve({
          success: false,
          error: `Timeout waiting for servcies: ${missing.join(", ")}`,
          service: missing[0],
        });
      }, timeoutMs);
    });
  }

  private async validateReferences(
    artisanId: string,
    clientId: string,
    serviceId: string
  ): Promise<void> {
    const [artisan, service] = await Promise.all([
      this.userManagementClient?.getArtisan(artisanId),
      this.serviceManagementClient?.getService(serviceId),
    ]);

    if (!artisan?.exists) throw new Error("Artisan does not exist");
    if (!service?.exists) throw new Error("Service does not exist");
  }
  async getArtisanAverageRating(artisanId: string) {
    return await this.ratingCalculator?.calculateAverageArtisanRating(
      artisanId
    );
  }

  async getServiceAverageRating(serviceId: string) {
    return await this.ratingCalculator?.calculateAverageServiceRating(
      serviceId
    );
  }

  async updateReview(
    reviewId: string,
    update: {
      comment?: string;
      artisanRating?: {
        value: number;
        dimensions?: {
          quality?: number;
          professionalism?: number;
          communication?: number;
          punctuality?: number;
        };
      };
      serviceRating?: {
        value: number;
        dimensions?: {
          quality?: number;
          professionalism?: number;
          communication?: number;
          punctuality?: number;
        };
      };
    }
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new BadRequestError("Review not found");
    }

    const newArtisanRating = update.artisanRating
      ? new Rating(update.artisanRating.value, update.artisanRating.dimensions)
      : undefined;
    const newServiceRating = update.serviceRating
      ? new Rating(update.serviceRating.value, update.serviceRating.dimensions)
      : undefined;

    review.updateContent(update.comment, newArtisanRating, newServiceRating);

    await this.reviewRepository.update(review);

    await this.processReview(review);

    return review;
  }

  async deleteReview(id: string, userRole?: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new BadRequestError("Review not found");

    //if (!review.canBeDeleted()) {
    //  throw new BadRequestError(
    //    "Only pending or flagged reviews can be deleted"
    //  );
    //}
    if (!review.canBeDeleted(userRole)) {
      // Pass userRole here
      throw new BadRequestError(
        userRole === "ADMIN"
          ? "Admin override failed"
          : "Only pending or flagged reviews can be deleted"
      );
    }

    await this.reviewRepository.delete(id);
  }

  async findByArtisan(artisanId: string, status?: string) {
    if (status === "published") {
      return await this.reviewRepository.findPublishedByArtisan(artisanId);
    }
    return await this.reviewRepository.findByArtisan(artisanId);
  }

  async findByService(serviceId: string, status?: string) {
    if (status === "published") {
      return await this.reviewRepository.findPublishedByService(serviceId);
    }
    return await this.reviewRepository.findByService(serviceId);
  }

  async getAllReviews(): Promise<Review[]> {
    return await this.reviewRepository.findAll();
  }
  async getReviewById(id: string): Promise<Review | null> {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new BadRequestError("Review not found");
    }
    return review;
  }
}
