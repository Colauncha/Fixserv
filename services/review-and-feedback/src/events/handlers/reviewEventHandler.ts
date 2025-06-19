import { BadRequestError, RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { UserManagementClient } from "../../infrastructure/clients/userManagementClient";
import { ServiceManagementClient } from "../../infrastructure/clients/serviceManagementClient";
import { ArtisanRatedEvent } from "../artisanRatedEvent";
import { ReviewRepository } from "../../domain/repository/reviewRepository";
import { ReviewCreatedEvent, ReviewProcessedEvent } from "../reviewEvents";
import { ServiceRatedEvent } from "../serviceRatedEvent";
import { Review } from "../../domain/entities/review";

export class ReviewEventsHandler {
  constructor(
    private ratingCalculator: RatingCalculator,
    private userManagementClient: UserManagementClient,
    private serviceManagementClient: ServiceManagementClient,
    private reviewRepository?: ReviewRepository
  ) {}
  private eventBus = new RedisEventBus(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const reviewSub = await this.eventBus.subscribe(
      "review_events",
      async (event: any) => {
        if (event.eventName === "ReviewCreated") {
          await this.handleReviewCreated(event);
        } else if (event.eventName === "ReviewProcessed") {
          await this.handleReviewProcessed(event);
        }
      }
    );
    this.subscriptions.push(reviewSub);

    const ratingSub = await this.eventBus.subscribe(
      "rating_events",
      async (event: any) => {
        if (event.eventName === "ArtisanRated") {
          await this.handleArtisanRated(event);
        } else if (event.eventName === "serviceRated") {
          await this.handleServiceRated(event);
        }
      }
    );
    this.subscriptions.push(ratingSub);
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      // 1. Validate the incoming event
      if (
        !event.payload.reviewId ||
        !event.payload.artisanId ||
        !event.payload.serviceId
      ) {
        throw new BadRequestError("Invalid review created event payload");
      }

      const review = await this.reviewRepository?.findById(
        event.payload.reviewId
      );

      if (review?.status === "published") {
        console.log(`Review ${review.id} already published - skipping`);
        return;
      }

      if (!review || review.status === "flagged") {
        throw new Error(`Review ${event.payload.reviewId} not found`);
      }
      if (event.payload.status !== "published") {
        throw new Error("Only published reviews can be processed");
      }
      if (review.status !== "processing") {
        review.markAsProcessing();
        await this.reviewRepository?.save(review);
        console.log(`Marked review ${review.id} as processing`);
      }

      const [artisanAvg, serviceAvg] = await Promise.all([
        this.ratingCalculator.calculateAverageArtisanRating(
          event.payload.artisanId
        ),
        this.ratingCalculator.calculateAverageServiceRating(
          event.payload.serviceId
        ),
      ]);

      // Update dependent services
      await Promise.all([
        this.userManagementClient.updateArtisanRating(
          event.payload.artisanId,
          artisanAvg
        ),
        this.serviceManagementClient.updateServiceRating(
          event.payload.serviceId,
          serviceAvg
        ),
      ]);

      review.markAsPublished();
      await this.reviewRepository?.save(review);
      const processedEvent = new ReviewProcessedEvent({
        reviewId: event.payload.reviewId,
        success: true,
        artisanId: event.payload.artisanId,
        serviceId: event.payload.serviceId,
        newArtisanRating: artisanAvg,
        newServiceRating: serviceAvg,
      });
      await this.eventBus.publish("review_ack_events", processedEvent);
    } catch (error: any) {
      const ack = new EventAck(
        event.payload.reviewId,
        "failed",
        "review-and-feedback",
        error.message
      );
      await this.eventBus.publish("event_acks", ack);
      // Publish failed processing event
      const processedEvent = new ReviewProcessedEvent({
        reviewId: event.payload.reviewId,
        success: false,
        error: error.message,
      });
      await this.eventBus.publish("review_ack_events", processedEvent);
    }
  }

  private async handleReviewProcessed(event: ReviewProcessedEvent) {
    // Here you would handle the result of the processing
    // For example, update some internal state or trigger notifications
    if (event.payload.success) {
      console.log(`Successfully processed review ${event.payload.reviewId}`);
      console.log(`New artisan rating: ${event.payload.newArtisanRating}`);
      console.log(`New service rating: ${event.payload.newServiceRating}`);
    } else {
      console.error(
        `Failed to process review ${event.payload.reviewId}: ${event.payload.error}`
      );
    }
  }

  private async handleArtisanRated(event: ArtisanRatedEvent) {
    try {
      console.log(
        `Artisan ${event.payload.artisanId} received new rating: ${event.payload.newRating}`
      );

      const ack = new ArtisanRatedEvent({
        artisanId: event.payload.artisanId,
        newRating: event.payload.newRating,
      });
      await this.eventBus.publish("event_acks", ack);
    } catch (error: any) {
      // Send NACK
      const ack = new EventAck(
        event.payload.artisanId,
        "failed",
        "review-and-feedback",
        error.message
      );
      await this.eventBus.publish("event_acks", ack);
    }
  }

  private async handleServiceRated(event: ServiceRatedEvent) {
    try {
      // Similar to handleArtisanRated but for services
      console.log(
        `Service ${event.payload.serviceId} received new rating: ${event.payload.newRating}`
      );

      // Send ACK
      const ack = new EventAck(
        event.payload.serviceId,
        "processed",
        "review-and-feedback"
      );
      await this.eventBus.publish("event_acks", ack);
    } catch (error: any) {
      // Send NACK
      const ack = new EventAck(
        event.payload.serviceId,
        "failed",
        "review-and-feedback",
        error.message
      );
      await this.eventBus.publish("event_acks", ack);
    }
  }
}
