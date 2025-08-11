import { RedisEventBus } from "@fixserv-colauncha/shared";
import { CreateNotificationUseCase } from "../../application/use-cases/createNotification";

export class UserEventsHandler {
  constructor(
    private eventBus: RedisEventBus,
    private createNotificationUseCase: CreateNotificationUseCase
  ) {}

  async setupSubscriptions(): Promise<void> {
    await this.eventBus.subscribe("user_events", async (event: any) => {
      switch (event.eventName) {
        case "UserCreatedEvent":
          await this.handleUserCreated(event);
          break;
      }
    });

    console.log("Notifications service subscribed to user_events");
  }

  private async handleUserCreated(event: any): Promise<void> {
    try {
      await this.createNotificationUseCase.execute({
        userId: event.payload.userId,
        type: "USER_CREATED",
        title: "Welcome to FixServ!",
        message: `Hello ${event.payload.fullName}, welcome to our platform!`,
        data: {
          userRole: event.payload.role,
          email: event.payload.email,
        },
      });

      console.log(
        `Welcome notification created for user: ${event.payload.userId}`
      );
    } catch (error) {
      console.error("Error handling UserCreated event:", error);
    }
  }
}
