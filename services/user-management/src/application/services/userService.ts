import { v4 as uuidv4 } from "uuid";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { Email } from "../../domain/value-objects/email";
import { Password } from "../../domain/value-objects/password";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { SkillSet } from "../../domain/value-objects/skillSet";
import { TokenService } from "../../infrastructure/services/tokenService";
import { IUserService } from "../../interfaces/IUserService";
import { ArtisanCreatedEvent } from "../../events/artisanCreatedEvent";
import { UserCreatedEvent } from "../../events/userCreatedEvent";
import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";

export class UserService implements IUserService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private pendingEvents = new Map<string, Promise<EventAck>>();

  constructor(private userRepository: IUserRepository) {}

  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
    phoneNumber: string,
    clientData?: {
      deliveryAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      servicePreferences: string[];
    },
    artisanData?: {
      businessName: string;
      location: string;
      rating: number;
      skillSet: string[];
      businessHours: Record<string, { open: string; close: string }>;
    },
    adminData?: {
      permissions: string[];
    }
  ): Promise<{ user: UserAggregate }> {
    const emailData = new Email(email);
    const passwordData = await Password.create(password);

    let user: UserAggregate;
    let eventsToPublish: any[] = [];

    switch (role) {
      case "CLIENT":
        if (!clientData) throw new BadRequestError("Client data required");
        user = UserAggregate.createClient(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          phoneNumber,
          new DeliveryAddress(
            clientData.deliveryAddress.city,
            clientData.deliveryAddress.country,
            clientData.deliveryAddress.postalCode,
            clientData.deliveryAddress.state,
            clientData.deliveryAddress.street
          ),
          new ServicePreferences(clientData.servicePreferences)
        );

        // Create UserCreatedEvent for wallet service
        const clientUserEvent = new UserCreatedEvent({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: "CLIENT",
          additionalData: {
            servicePreferences: clientData.servicePreferences,
          },
        });
        eventsToPublish.push({
          channel: "user_events",
          event: clientUserEvent,
        });
        break;

      case "ARTISAN":
        if (!artisanData) throw new BadRequestError("Artisan data required");
        user = UserAggregate.createArtisan(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          phoneNumber,
          artisanData.businessName,
          artisanData.location,
          artisanData.rating,
          new SkillSet(artisanData.skillSet),
          new BusinessHours(artisanData.businessHours)
        );

        // Create UserCreatedEvent for wallet service
        const artisanUserEvent = new UserCreatedEvent({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: "ARTISAN",
          additionalData: {
            businessName: artisanData.businessName,
            skills: artisanData.skillSet,
            location: artisanData.location,
          },
        });

        // Create ArtisanCreatedEvent for service management
        const artisanEvent = new ArtisanCreatedEvent({
          userId: user.id,
          fullName: user.fullName,
          skills: user.skills.skills,
          businessName: artisanData.businessName,
          // location: artisanData.location
        });

        eventsToPublish.push(
          { channel: "user_events", event: artisanUserEvent },
          { channel: "artisan_events", event: artisanEvent }
        );
        break;

      case "ADMIN":
        if (!adminData) throw new BadRequestError("Admin data required");
        user = UserAggregate.createAdmin(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          phoneNumber,
          adminData.permissions
        );

        // Admins might not need wallets, but if they do:
        //const adminUserEvent = new UserCreatedEvent({
        //  userId: user.id,
        //  email: user.email.value,
        //  fullName: user.fullName,
        //  role: "ADMIN",
        //  additionalData: {
        //    permissions: adminData.permissions
        //  }
        //});
        //eventsToPublish.push({ channel: "user_events", event: //adminUserEvent });
        break;

      default:
        throw new BadRequestError("Invalid role");
    }

    try {
      // Save user first
      await this.userRepository.save(user);

      // Publish all events
      const publishPromises = eventsToPublish.map(
        async ({ channel, event }) => {
          // Set up acknowledgment tracking if needed
          if (channel === "artisan_events") {
            const ackPromise = this.setupEventAcknowledgment(event.id);
            this.pendingEvents.set(event.id, ackPromise);
          }

          await this.eventBus.publish(channel, event);

          // Wait for acknowledgment for critical events
          if (channel === "artisan_events") {
            try {
              const ack = await Promise.race([
                this.pendingEvents.get(event.id)!,
                this.timeout(8000),
              ]);
              this.pendingEvents.delete(event.id);

              if (ack && ack.status === "failed") {
                console.error(`Event processing failed: ${ack.error}`);
                // Decide if you want to throw or just log
              }
            } catch (timeoutError) {
              console.error(
                `Event acknowledgment timeout for event ${event.id}`
              );
              this.pendingEvents.delete(event.id);
            }
          }
        }
      );

      await Promise.all(publishPromises);
    } catch (err: any) {
      // Clean up pending events on error
      eventsToPublish.forEach(({ event }) => {
        this.pendingEvents.delete(event.id);
      });
      throw new BadRequestError(`User registration failed: ${err.message}`);
    }

    return { user };
  }

  private setupEventAcknowledgment(eventId: string): Promise<EventAck> {
    return new Promise<EventAck>(async (resolve) => {
      const sub = await this.eventBus.subscribe(
        "event_acks",
        (ack: EventAck) => {
          if (ack.originalEventId === eventId) {
            resolve(ack);
            sub.unsubscribe();
          }
        }
      );
    });
  }
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout reached")), ms)
    );
  }
  async updateProfilePicture(
    userId: string,
    imageUrl: string
  ): Promise<UserAggregate> {
    console.log(
      `Updating profile picture for user ${userId} with URL: ${imageUrl}`
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    user.updateProfilePicture(imageUrl);
    await this.userRepository.save(user);
    return user;
  }
}
