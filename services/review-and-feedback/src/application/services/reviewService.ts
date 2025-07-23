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
  ReviewProcessedEvent,
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
        ["user", "service"],
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
          status: review.status,
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
    reviewId: string,
    requiredServices: ("user" | "service")[],
    timeoutMs = 10000
  ): Promise<{ success: boolean; error?: string; service?: string }> {
    return new Promise(async (resolve) => {
      const receivedAcks: {
        [service: string]: { success: boolean; error?: string };
      } = {};

      const subscription: {
        unsubscribe: () => Promise<void>;
      } = await this.eventBus.subscribe(
        "review_ack_events",
        (event: ReviewProcessedEvent) => {
          if (event.payload.reviewId === reviewId) {
            // Determine service type from event
            const service = event.payload.artisanId
              ? "user"
              : event.payload.serviceId
              ? "service"
              : undefined;

            if (service && requiredServices.includes(service)) {
              receivedAcks[service] = {
                success: event.payload.success,
                error: event.payload.error,
              };

              // Check if all required services have responded
              const allResponded = requiredServices.every(
                (s) => receivedAcks[s] !== undefined
              );

              if (allResponded) {
                subscription.unsubscribe();
                const allSuccess = requiredServices.every(
                  (s) => receivedAcks[s].success
                );
                resolve({
                  success: allSuccess,
                  error: allSuccess
                    ? undefined
                    : Object.values(receivedAcks).find((ack) => !ack.success)
                        ?.error,
                  service: allSuccess
                    ? undefined
                    : requiredServices.find((s) => !receivedAcks[s].success),
                });
              }

              // Fail fast if any service fails
              if (!event.payload.success) {
                subscription.unsubscribe();
                resolve({
                  success: false,
                  error: event.payload.error,
                  service,
                });
              }
            }
          }
        }
      );

      setTimeout(() => {
        subscription.unsubscribe();
        const missingServices = requiredServices.filter(
          (s) => !receivedAcks[s]
        );
        resolve({
          success: false,
          error: `Timeout waiting for services: ${missingServices.join(", ")}`,
          service: missingServices[0],
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

  async deleteReview(id: string): Promise<void> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new BadRequestError("Review not found");

    if (!review.canBeDeleted()) {
      throw new BadRequestError(
        "Only pending or flagged reviews can be deleted"
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
