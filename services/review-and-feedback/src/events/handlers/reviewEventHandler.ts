import { BadRequestError, RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { UserManagementClient } from "../../infrastructure/clients/userManagementClient";
import { ServiceManagementClient } from "../../infrastructure/clients/serviceManagementClient";
import { ArtisanRatedEvent } from "../artisanRatedEvent";
import { ReviewRepository } from "../../domain/repository/reviewRepository";
import { ReviewCreatedEvent, ReviewUpdatedEvent } from "../reviewEvents";
import { ServiceRatedEvent } from "../serviceRatedEvent";
import { Review } from "../../domain/entities/review";

export class ReviewEventsHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];
  constructor(
    private ratingCalculator: RatingCalculator,
    private userManagementClient: UserManagementClient,
    private serviceManagementClient: ServiceManagementClient,
    private reviewRepository?: ReviewRepository
  ) {}

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "review_events",
      async (event: ReviewCreatedEvent | ReviewUpdatedEvent) => {
        if (
          event.eventName === "ReviewCretaed" ||
          event.eventName === "ReviewUpdated"
        ) {
          await this.onReviewEvent(event);
        }
      }
    );
    this.subscriptions.push(sub);
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
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

  private async onReviewEvent(event: ReviewCreatedEvent | ReviewUpdatedEvent) {
    try {
      const newArtisanRating =
        await this.ratingCalculator.calculateAverageArtisanRating(
          event.payload.artisanId
        );

      const newServiceRating =
        await this.ratingCalculator.calculateAverageServiceRating(
          event.payload.serviceId
        );

      // Persist (if you keep local copy)

      await this.userManagementClient.updateArtisanRating(
        event.payload.artisanId,
        newArtisanRating
      );

      await this.serviceManagementClient.updateServiceRating(
        event.payload.serviceId,
        newServiceRating
      );

      await this.eventBus.publish(
        "rating_events",
        new ArtisanRatedEvent({
          artisanId: event.payload.artisanId,
          newRating: newArtisanRating,
        })
      );

      await this.eventBus.publish(
        "rating_events",
        new ServiceRatedEvent({
          serviceId: event.payload.serviceId,
          newRating: newServiceRating,
        })
      );

      //Ack
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "processed", "review-and-feedback")
      );
    } catch (error: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "failed", "review-and-feedback", error.message)
      );
      throw new BadRequestError(error.message);
    }
  }
}
