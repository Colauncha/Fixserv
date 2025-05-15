import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";

export class ReviewEventsHandler {
  constructor() {}
  private userRepository = new UserRepositoryImpl();
  private eventBus = new RedisEventBus();
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "review_events",
      async (event: any) => {
        if (event.eventName === "ReviewCreated") {
          await this.handleReviewCreated(event);
        }
      }
    );
    console.log("UserManagement subscribed to review_events");
    return sub.unsubscribe;
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      console.log(
        "UserManagement received ReviewCreated:",
        event.payload.reviewId
      );
      // const newRating = await this.ratingCalculator.calculateAverage(
      // event.payload.artisanId
      // );
      //update artisan rating
      await this.userRepository.updateRating(
        event.payload.artisanId,
        event.payload.artisanRating
      );

      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          artisanId: event.payload.artisanId,
          newArtisanRating: event.payload.artisanRating,
        })
      );
    } catch (error: any) {
      console.error("Failed to update artisan rating:", error);
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: false,
          error: error.message,
        })
      );
    }
  }

  private async handleArtisanRated(event: any) {
    console.log(
      `Artisan ${event.payload.artisanId} received new rating: ${event.payload.newRating}`
    );
  }
}
