import { EventAck, RedisEventBus } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewRepositoryClient";
import { createAxiosClient } from "../../interfaces/http/axiosClient";
import { ReviewPublishedEvent } from "../reviewPublishedEvent";
import { ArtisanRatedEvent } from "../artisanRatedEvent";

export class ReviewEventsHandler {
  private userRepository = new UserRepositoryImpl();
  // private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  private reviewClient = new ReviewRepositoryClient(
    createAxiosClient(process.env.REVIEW_AND_FEEDBACK_URL!)
  );
  private ratingCalculator = new RatingCalculator(this.reviewClient);

  constructor(private eventBus: RedisEventBus) {}

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "review_events",
      async (evt: any) => {
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
      }
    );
    this.subscriptions.push(sub);
    console.log("User-Management subscribed to review_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      // tell review‐and‐feedback we accepted the task
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.payload.reviewId, "processed", "user-management")
      );
      console.log("A new review was created and being processed");
    } catch (e: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(e.payload.reviewId, "failed", "user-management")
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
        "event_acks",
        new EventAck(event.payload.reviewId, "processed", "user-management")
      );
      console.log("Artisan rating updated");
    } catch (e: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(e.payload.reviewId, "failed", "user-management")
      );
    }
  }
}
