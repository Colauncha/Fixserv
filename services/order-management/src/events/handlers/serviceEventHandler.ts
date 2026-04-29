import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceModel } from "../../modules_from_other_services/infrastructure/persistence/model/serviceModel";

export class ServiceEventsHandler {
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  constructor(private eventBus: RedisEventBus) {}

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "service_events",
      async (event: any) => {
        console.log(`[order-management] service_events: ${event.eventName}`);

        switch (event.eventName) {
          case "ServiceCreated":
            await this.handleServiceCreated(event);
            break;
          case "ServiceUpdated":
            await this.handleServiceUpdated(event);
            break;
          case "ServiceDeleted":
            await this.handleServiceDeleted(event);
            break;
        }
      },
    );
    this.subscriptions.push(sub);
    console.log("✅ Order-Management subscribed to service_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleServiceCreated(event: any) {
    try {
      const {
        serviceId,
        artisanId,
        title,
        description,
        bio,
        price,
        estimatedDuration,
        skillSet,
        isActive,
        rating,
      } = event.payload;

      await ServiceModel.findOneAndUpdate(
        { _id: serviceId },
        {
          _id: serviceId,
          artisanId,
          title,
          description,
          bio,
          price,
          estimatedDuration,
          skillSet,
          isActive,
          rating,
          updatedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      console.log(`✅ Service synced to order-management DB: ${serviceId}`);
    } catch (error: any) {
      console.error("handleServiceCreated failed:", error.message);
    }
  }

  private async handleServiceUpdated(event: any) {
    try {
      const { serviceId, ...updates } = event.payload;

      // Build update object only with provided fields
      const updateFields: any = { updatedAt: new Date() };
      if (updates.title !== undefined) updateFields.title = updates.title;
      if (updates.description !== undefined)
        updateFields.description = updates.description;
      if (updates.bio !== undefined) updateFields.bio = updates.bio;
      if (updates.price !== undefined) updateFields.price = updates.price;
      if (updates.estimatedDuration !== undefined)
        updateFields.estimatedDuration = updates.estimatedDuration;
      if (updates.skillSet !== undefined)
        updateFields.skillSet = updates.skillSet;
      if (updates.isActive !== undefined)
        updateFields.isActive = updates.isActive;

      await ServiceModel.findOneAndUpdate(
        { _id: serviceId },
        { $set: updateFields },
        { new: true },
      );

      console.log(`✅ Service updated in order-management DB: ${serviceId}`);
    } catch (error: any) {
      console.error("handleServiceUpdated failed:", error.message);
    }
  }

  private async handleServiceDeleted(event: any) {
    try {
      const { serviceId } = event.payload;

      await ServiceModel.findOneAndDelete({ _id: serviceId });

      console.log(`✅ Service deleted from order-management DB: ${serviceId}`);
    } catch (error: any) {
      console.error("handleServiceDeleted failed:", error.message);
    }
  }
}
