import { RedisEventBus } from "@fixserv-colauncha/shared";
import { CreateNotificationUseCase } from "../../application/use-cases/createNotification";

export class ReviewEventsHandler {
  constructor(
    private eventBus: RedisEventBus,
    private createNotificationUseCase: CreateNotificationUseCase
  ) {}

  async setupSubscriptions(): Promise<void> {
    await this.eventBus.subscribe("review_events", async (event: any) => {
      switch (event.eventName) {
        case "ReviewCreated":
          await this.handleReviewCreated(event);
          break;
        case "ReviewPublished":
          await this.handleReviewPublished(event);
          break;
      }
    });

    console.log("Notifications service subscribed to review_events");
  }

  private async handleReviewCreated(event: any): Promise<void> {
    try {
      // Notify artisan about new review
      await this.createNotificationUseCase.execute({
        userId: event.payload.artisanId,
        type: "REVIEW_CREATED",
        title: "New Review Received",
        message: "You have received a new review for your service.",
        data: {
          reviewId: event.payload.reviewId,
          clientId: event.payload.clientId,
        },
      });

      console.log(
        `Review notification created for artisan: ${event.payload.artisanId}`
      );
    } catch (error) {
      console.error("Error handling ReviewCreated event:", error);
    }
  }

  private async handleReviewPublished(event: any): Promise<void> {
    try {
      // Notify artisan that review is now public
      await this.createNotificationUseCase.execute({
        userId: event.payload.artisanId,
        type: "REVIEW_PUBLISHED",
        title: "Review Published",
        message:
          "Your review has been published and is now visible to other users.",
        data: {
          reviewId: event.payload.reviewId,
          rating: event.payload.rating,
        },
      });

      console.log(
        `Review published notification created for artisan: ${event.payload.artisanId}`
      );
    } catch (error) {
      console.error("Error handling ReviewPublished event:", error);
    }
  }
}
