import { EventAck, RedisEventBus } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewRepositoryClient";
import { createAxiosClient } from "../../interfaces/http/axiosClient";
import { ReviewPublishedEvent } from "../reviewPublishedEvent";

export class ReviewEventsHandler {
  constructor() {}
  private userRepository = new UserRepositoryImpl();
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  private reviewClient = new ReviewRepositoryClient(
    createAxiosClient(process.env.REVIEW_AND_FEEDBACK_URL!)
  );
  private ratingCalculator = new RatingCalculator(this.reviewClient);

  //async setupSubscriptions() {
  //  const sub = await this.eventBus.subscribe(
  //    "review_events",
  //    async (event: any) => {
  //      if (event.eventName === "ReviewCreated") {
  //        await this.handleReviewCreated(event);
  //      }
  //    }
  //  );
  //  console.log("UserManagement subscribed to review_events");
  //  return sub.unsubscribe;
  //}
  async setupSubscriptions() {
    await this.eventBus.subscribe("review_events", async (evt: any) => {
      switch (evt.eventName) {
        case "ReviewCreated":
          await this.handleReviewCreated(new ReviewCreatedEvent(evt.payload));
          break;
        case "ReviewPublished":
          await this.handleReviewPublished(
            new ReviewPublishedEvent(evt.payload)
          );
          break;
      }
    });

    console.log("User-Management subscribed to review_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }
  /*
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
      // await this.userRepository.updateRating(
      //   event.payload.artisanId,
      //   event.payload.artisanRating
      // );

      const averageRating =
        await this.ratingCalculator.calculateAverageArtisanRating(
          event.payload.artisanId
        );

      await this.userRepository.updateRating(
        event.payload.artisanId,
        averageRating
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
    */

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      // tell review‐and‐feedback we accepted the task
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          artisanId: event.payload.artisanId, // optional
        })
      );
    } catch (e: any) {
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: false,
          error: e.message,
        })
      );
    }
  }

  /** 2️⃣ final rating update after review is published */
  private async handleReviewPublished(event: ReviewPublishedEvent) {
    try {
      const avg = await this.ratingCalculator.calculateAverageArtisanRating(
        event.payload.artisanId
      );

      await this.userRepository.updateRating(event.payload.artisanId, avg);

      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          artisanId: event.payload.artisanId,
          newArtisanRating: avg,
        })
      );
    } catch (e: any) {
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: false,
          error: e.message,
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
