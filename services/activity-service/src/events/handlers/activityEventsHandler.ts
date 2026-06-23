import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ActivityLogModel } from "../../infrastructure/persistence/models/activityModel";

export class ActivityEventsHandler {
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  constructor(private eventBus: RedisEventBus) {}

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "activity_events",
      async (event: any) => {
        if (event.eventName !== "ActivityEvent") return;

        try {
          await ActivityLogModel.create({
            action: event.payload.action,
            actorId: event.payload.actorId,
            actorRole: event.payload.actorRole,
            targetId: event.payload.targetId,
            targetType: event.payload.targetType,
            service: event.payload.service,
            metadata: event.payload.metadata ?? {},
            timestamp: event.timestamp ?? new Date(),
          });
        } catch (error: any) {
          console.error(
            "[activity-service] Failed to persist activity:",
            error.message,
          );
        }
      },
    );

    this.subscriptions.push(sub);
    console.log("Activity-Service: Subscribed to activity_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((s) => s.unsubscribe()));
  }
}
