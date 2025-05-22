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
import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";

export class UserService implements IUserService {
  private eventBus = new RedisEventBus();
  private pendingEvents = new Map<string, Promise<EventAck>>();
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService
  ) {}

  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
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
  ): Promise<{ user: UserAggregate; sessionToken: string }> {
    const emailData = new Email(email);
    const passwordData = await Password.create(password);

    let user: UserAggregate;

    switch (role) {
      case "CLIENT":
        if (!clientData) throw new BadRequestError("Client data required");
        user = UserAggregate.createClient(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          new DeliveryAddress(
            clientData.deliveryAddress.city,
            clientData.deliveryAddress.country,
            clientData.deliveryAddress.postalCode,
            clientData.deliveryAddress.state,
            clientData.deliveryAddress.street
          ),
          new ServicePreferences(clientData.servicePreferences)
        );
        break;

      case "ARTISAN":
        if (!artisanData) throw new BadRequestError("Artisan data required");
        user = UserAggregate.createArtisan(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          artisanData.businessName,
          artisanData.location,
          artisanData.rating,
          new SkillSet(artisanData.skillSet),
          new BusinessHours(artisanData.businessHours)
        );
        const event = new ArtisanCreatedEvent({
          name: user.businessName,
          skills: user.skills.skills,
        });

        // let unsubscribe: () => Promise<void> = async () => {};
        // const ackPromise = new Promise<EventAck>(async (resolve) => {
        //   const sub: { unsubscribe: () => Promise<void> } =
        //     await this.eventBus.subscribe("event_acks", (ack) => {
        //       if (ack.originalEventId === event.id) {
        //         resolve(ack);
        //       }
        //     });
        //   unsubscribe = sub.unsubscribe;
        // });
        // await this.userRepository.save(user);
        // this.pendingEvents.set(event.id, ackPromise);
        //
        try {
          //   await this.eventBus.publish("artisan_events", event);
          //   const ack = await Promise.race([ackPromise, timeout(5000)]);
          //   if (ack.status === "failed") {
          //     throw new BadRequestError(`Event processing failed: ${ack.//error}`);
          //   }
        } catch (err: any) {
          throw new BadRequestError(err);
        }

        break;

      case "ADMIN":
        if (!adminData) throw new BadRequestError("Admin data required");
        user = UserAggregate.createAdmin(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          adminData.permissions
        );
        break;
      default:
        throw new BadRequestError("Invalid role");
    }

    //const event = new ArtisanCreatedEvent({
    //  name: user.businessName,
    //  skills: user.skills.skills,
    //});
    const sessionToken = this.tokenService.generateSessionToken(
      user.id,
      user.email,
      user.role
    );

    await this.userRepository.save(user);
    return { user, sessionToken };
  }
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout reached")), ms)
  );
}
