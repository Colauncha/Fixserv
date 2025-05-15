import { RedisEventBus } from "@fixserv-colauncha/shared";

export class ServiceEventsHandler {
  private eventBus = new RedisEventBus();

  async setupSubscriptions() {
    await this.eventBus.subscribe("service_events", (event: any) => {
      if (event.eventName === "ServiceCreated") {
        this.handleServiceCreated(event);
      }
    });

    await this.eventBus.subscribe("rating_updated", (event: any) => {
      this.handleRatingUpdate(event);
    });
  }

  private handleServiceCreated(event: any) {
    console.log("Service created event received:", event);
    // Handle the event - update user preferences, send notifications, etc.
  }

  private handleRatingUpdate(event: any) {
    console.log("Rating updated:", event);
    // Handle the event - update user preferences,  send notifications, etc.
  }
}
