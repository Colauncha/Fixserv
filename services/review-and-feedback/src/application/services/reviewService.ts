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

export class ReviewService {
  private eventBus = new RedisEventBus();
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
    console.log(`Review ${review.id} saved with status: ${review.status}`);

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

      const ackResult = await this.waitForProcessingAck(
        review.id,
        ["user", "service"],
        15000
      );

      if (ackResult.success) {
        review.markAsPublished();
      } else {
        review.markAsFailed(ackResult.error || "Processing failed");
      }

      await this.reviewRepository.save(review);
    } catch (error: any) {
      review.markAsFailed(error.message);
      await this.reviewRepository.save(review);
      throw error;
    } finally {
      this.processingReviews.delete(review.id);
    }
  }

  private async waitForProcessingAck1(
    reviewId: string,
    timeoutMs = 10000
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise(async (resolve) => {
      let resolved = false;
      const acks: { success: boolean; error?: string }[] = [];

      const subscription: {
        unsubscribe: () => Promise<void>;
      } = await this.eventBus.subscribe(
        "review_ack_events",
        (event: ReviewProcessedEvent) => {
          if (event.payload.reviewId === reviewId) {
            acks.push({
              success: event.payload.success,
              error: event.payload.error,
            });
            //resolve asap, if there is no error
            if (!event.payload.success && !resolved) {
              resolved = true;
              subscription.unsubscribe();
              resolve({ success: false, error: event.payload.error });
            }
          }
        }
      );
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.unsubscribe();
          // Use latest ack if we have any, otherwise timeout
          const latestAck = acks[acks.length - 1];
          resolve(
            latestAck || {
              success: false,
              error: "Processing acknowledgement timeout",
            }
          );
        }
      }, timeoutMs);
    });
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
      throw new Error("Review not found");
    }

    if (update.comment) {
      review.updateFeedback(update.comment);
    }

    if (update.artisanRating) {
      const newArtisanRating = new Rating(
        update.artisanRating.value,
        update.artisanRating.dimensions
      );
      const newServiceRating = update.serviceRating
        ? new Rating(
            update.serviceRating.value,
            update.serviceRating.dimensions
          )
        : review.serviceRating;

      review.updateRatings(newArtisanRating, newServiceRating);
    } else if (update.serviceRating) {
      const newServiceRating = new Rating(
        update.serviceRating.value,
        update.serviceRating.dimensions
      );
      review.updateRatings(review.artisanRating, newServiceRating);
    }
    await this.reviewRepository.update(review);

    return review;
  }
}
