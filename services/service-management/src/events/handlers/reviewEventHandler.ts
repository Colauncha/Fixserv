import { EventAck, RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceRepositoryImpl } from "../../infrastructure/serviceRepositoryImpl";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewClient";
import { ReviewPublishedEvent } from "../reviewPublishedEvent";

export class ReviewEventsHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private serviceRepository = new ServiceRepositoryImpl();
  private reviewRepoClient = new ReviewRepositoryClient();
  private ratingCalculator = new RatingCalculator(this.reviewRepoClient);

  async setupSubscriptions() {
    await this.eventBus.subscribe("review_events", async (evt: any) => {
      switch (evt.eventName) {
        case "ReviewCreated":
          await this.handleReviewCreated(new ReviewCreatedEvent(evt.payload));
          break;
        case "ReviewPublished":
          await this.handleReviewPublished(
            new ReviewPublishedEvent(evt.payload),
          );
          break;
      }
    });

    console.log("Service-Management subscribed to review_events");
  }

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      // **just acknowledge — no rating update yet**
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "processed", "service-management"),
      );
      console.log(`service-Management: ACK sent for ReviewCreated ${event.id}`);
    } catch (e: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "failed", "service-management", e.message),
      );
    }
  }

  /** 2️⃣ final rating update after review is published 
  private async handleReviewPublished(event: ReviewPublishedEvent) {
    try {
      const avg = await this.ratingCalculator.calculateAverageServiceRating(
        event.payload.serviceId,
      );

      await this.serviceRepository.updateRating(event.payload.serviceId, avg);

      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.payload.reviewId, "processed", "service-management"),
      );
      console.log("Service rating updated");
    } catch (e: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(e.payload.reviewId, "failed", "service-management"),
      );
    }
  }
  */

  private async handleReviewPublished(event: ReviewPublishedEvent) {
    try {
      // Recalculate average including the newly published review
      const { average, count } =
        await this.ratingCalculator.calculateAverageServiceRating(
          event.payload.serviceId,
        );

      // Update artisan's rating AND review count in user-management DB
      await this.serviceRepository.updateRating(
        event.payload.serviceId,
        average,
        count,
      );

      console.log(
        `✅ Service ${event.payload.serviceId} rating updated: ${average} (${count} reviews)`,
      );
    } catch (e: any) {
      // Non-fatal — rating update failed but review is already published
      console.error(
        `Failed to update service rating for ${event.payload.serviceId}:`,
        e.message,
      );
    }
  }
}
