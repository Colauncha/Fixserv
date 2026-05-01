// services/service-management/src/events/serviceEvents.ts
import { BaseEvent } from "@fixserv-colauncha/shared";

export class ServiceCreatedEvent extends BaseEvent {
  eventName = "ServiceCreated";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
      artisanId: string;
      title: string;
      description: string;
      bio: string;
      price: number;
      estimatedDuration: string;
      skillSet: string[];
      isActive: boolean;
      rating: number;
    },
  ) {
    super(payload);
  }
}

export class ServiceUpdatedEvent extends BaseEvent {
  eventName = "ServiceUpdated";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
      artisanId: string;
      title?: string;
      description?: string;
      bio?: string;
      price?: number;
      estimatedDuration?: string;
      skillSet?: string[];
      isActive?: boolean;
    },
  ) {
    super(payload);
  }
}

export class ServiceDeletedEvent extends BaseEvent {
  eventName = "ServiceDeleted";
  version = 1;

  constructor(
    public payload: {
      serviceId: string;
      artisanId: string;
    },
  ) {
    super(payload);
  }
}
