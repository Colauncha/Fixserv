import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceRepositoryImpl } from "../../infrastructure/serviceRepositoryImpl";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { ReviewRepositoryClient } from "../../infrastructure/clients/reviewClient";
import { createAxiosClient } from "../../interfaces/http/axiosClient";
import { ReviewPublishedEvent } from "../reviewPublishedEvent";

/*
export class ReviewEventHandler {
  private reviewRepoClient = new ReviewRepositoryClient();
  private serviceRepository = new ServiceRepositoryImpl();
  private eventBus = new RedisEventBus(process.env.REDIS_URL);
  private ratingCalculator = new RatingCalculator(this.reviewRepoClient);

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "review_events",
      async (event: any) => {
        if (event.eventName === "ReviewCreated") {
          await this.handleReviewCreated(event);
        }
      }
    );

    console.log("ServiceManagement subscribed to review_events");
    return sub.unsubscribe;
  }

  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      const { serviceId, reviewId, serviceRating } = event.payload;

      console.log(
        `ServiceManagement received ReviewCreated: ${reviewId}`,
        event.payload.reviewId
      );

      const newAvgRating =
        await this.ratingCalculator.calculateAverageServiceRating(serviceId);

      //   // Verify the review exists in review service
      //   const reviewExists = await this.verifyReviewExists(
      //     event.payload.reviewId
      //   );
      //   if (!reviewExists) {
      //     throw new Error(`Review ${event.payload.reviewId} not found`);
      //   }

      // Update service rating
      await this.serviceRepository.updateRating(serviceId, newAvgRating);

      // Send ACK
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId,
          success: true,
          serviceId,
          newServiceRating: newAvgRating,
        })
      );
    } catch (error: any) {
      console.error("Failed to update service rating:", error);
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: false,
          error: `Service rating update failed: ${error.message}`,
        })
      );
    }
  }
}
*/

export class ReviewEventsHandler {
  /* deps */
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private serviceRepository = new ServiceRepositoryImpl();
  private reviewRepoClient = new ReviewRepositoryClient();
  //private reviewClient = new ReviewRepositoryClient(
  //  createAxiosClient(process.env.REVIEW_AND_FEEDBACK_URL!)
  //);
  private ratingCalculator = new RatingCalculator(this.reviewRepoClient);

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

    console.log("Service-Management subscribed to review_events");
  }

  /** 1️⃣ quick ACK, no rating update */
  /*
  private async handleReviewCreated(event: ReviewCreatedEvent) {
    try {
      // tell review‐and‐feedback we accepted the task
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          serviceId: event.payload.serviceId, // optional
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
    */
  private async handleReviewCreated(event: ReviewCreatedEvent) {
    // **just acknowledge — no rating update yet**
    await this.eventBus.publish(
      "review_ack_events",
      new ReviewProcessedEvent({
        reviewId: event.payload.reviewId,
        success: true,
        serviceId: event.payload.serviceId, // ← gives waitForProcessingAck its "service" key
      })
    );
  }

  /** 2️⃣ final rating update after review is published */
  private async handleReviewPublished(event: ReviewPublishedEvent) {
    try {
      const avg = await this.ratingCalculator.calculateAverageServiceRating(
        event.payload.serviceId
      );

      await this.serviceRepository.updateRating(event.payload.serviceId, avg);

      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          serviceId: event.payload.serviceId,
          newServiceRating: avg,
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
}
