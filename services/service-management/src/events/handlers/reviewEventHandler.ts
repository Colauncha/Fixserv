import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceRepositoryImpl } from "../../infrastructure/serviceRepositoryImpl";
import { ReviewCreatedEvent } from "../reviewCreatedEvent";
import { ReviewProcessedEvent } from "../reviewProcessedEvent";
export class ReviewEventHandler {
  constructor() {}
  private serviceRepository = new ServiceRepositoryImpl();
  private eventBus = new RedisEventBus(process.env.REDIS_URL);

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
    console.log(
      "ServiceManagement received ReviewCreated:",
      event.payload.reviewId
    );

    try {
      //   // Verify the review exists in review service
      //   const reviewExists = await this.verifyReviewExists(
      //     event.payload.reviewId
      //   );
      //   if (!reviewExists) {
      //     throw new Error(`Review ${event.payload.reviewId} not found`);
      //   }

      // Update service rating
      await this.serviceRepository.updateRating(
        event.payload.serviceId,
        event.payload.serviceRating
      );

      // Send ACK
      await this.eventBus.publish(
        "review_ack_events",
        new ReviewProcessedEvent({
          reviewId: event.payload.reviewId,
          success: true,
          serviceId: event.payload.serviceId,
          newServiceRating: event.payload.serviceRating,
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
