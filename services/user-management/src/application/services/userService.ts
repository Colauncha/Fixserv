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
import { EmailService } from "../../infrastructure/services/emailServiceImpls";
import { JwtTokenService } from "../../infrastructure/services/jwtTokenService";

export class UserService implements IUserService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private pendingEvents = new Map<string, Promise<EventAck>>();
  private emailService = new EmailService();
  private tokenService = new JwtTokenService();
  constructor(private userRepository: IUserRepository) {}

  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
    phoneNumber: string,
    referralCode?: string,
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
    // referralCode?: string
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
          referralCode,
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
          referralCode,
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

      // Generate verification token and send verification email
      const verificationToken = this.tokenService.generateVerificationToken(
        user.id
      );
      user.setEmailVerificationToken(verificationToken);
      //await this.emailService.sendVerificationEmail(
      //  user.email,
      //  verificationToken
      //);

      //Update user verification token
      await this.userRepository.save(user);

      //send verification emaail
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken
      );

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
      return {
        user,
      };
    } catch (err: any) {
      // Clean up pending events on error
      eventsToPublish.forEach(({ event }) => {
        this.pendingEvents.delete(event.id);
      });
      throw new BadRequestError(`User registration failed: ${err.message}`);
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await this.tokenService.validateVerificationToken(token);
    if (!userId) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    if (user.isEmailVerified) {
      // Still invalidate the token even if already verified
      await this.tokenService.invalidateVerificationToken(userId);
      return { message: "Email is already verified" };
    }

    user.markEmailAsVerified();
    await this.userRepository.save(user);

    // IMPORTANT: Invalidate the token after successful verification
    await this.tokenService.invalidateVerificationToken(userId);

    // ⭐ NEW: Send welcome email in background (non-blocking)
    this.emailService
      .sendWaitlistWelcomeEmail(user.email, user.fullName)
      .catch((error) => {
        console.error(
          `Failed to send welcome email to ${user.email}:`,
          error.message
        );
        // Don't throw - this shouldn't block the verification success
      });

    return { message: "Email verified successfully" };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Security: Don't reveal if email exists or not
      return {
        message: "If the email exists, a verification email has been sent.",
      };
    }

    if (user.isEmailVerified) {
      return { message: "Email is already verified" };
    }

    const verificationToken = this.tokenService.generateVerificationToken(
      user.id
    );
    user.setEmailVerificationToken(verificationToken);

    await this.userRepository.save(user);
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    console.log(`📧 Verification email resent to: ${user.email}`);
    return { message: "Verification email sent successfully!" };
  }
  catch(error: any) {
    console.error("Error resending verification email:", error);
    return {
      message: "If the email exists, a verification email has been sent.",
    };
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
  async registerUserWaitingList(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN",
    phoneNumber: string,
    referralCode?: string
  ): Promise<{ user: UserAggregate }> {
    const emailData = new Email(email);
    const passwordData = await Password.create(password);
    let user: UserAggregate;
    let eventsToPublish: any[] = [];

    switch (role) {
      case "CLIENT":
        // Create client with default/empty values for optional fields
        user = UserAggregate.createClient(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          phoneNumber,
          // Default delivery address - user will update later
          new DeliveryAddress(
            "", // city
            "", // country
            "", // postalCode
            "", // state
            "" // street
          ),
          // Empty service preferences - user will update later
          new ServicePreferences([])
        );

        const clientUserEvent = new UserCreatedEvent({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: "CLIENT",
          referralCode,
          additionalData: {
            servicePreferences: [],
            profileIncomplete: true,
          },
        });

        eventsToPublish.push({
          channel: "user_events",
          event: clientUserEvent,
        });
        break;

      case "ARTISAN":
        // Create artisan with default/placeholder values
        user = UserAggregate.createArtisan(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          phoneNumber,
          "", // businessName - to be filled later
          "", // location - to be filled later
          0, // rating - default 0
          new SkillSet([]), // empty skills - to be filled later
          new BusinessHours({}) // empty business hours - to be filled later
        );

        const artisanUserEvent = new UserCreatedEvent({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          role: "ARTISAN",
          referralCode,
          additionalData: {
            businessName: "",
            skills: [],
            location: "",
            profileIncomplete: true,
          },
        });

        const artisanEvent = new ArtisanCreatedEvent({
          userId: user.id,
          fullName: user.fullName,
          skills: [],
          businessName: "",
        });

        eventsToPublish.push(
          { channel: "user_events", event: artisanUserEvent },
          { channel: "artisan_events", event: artisanEvent }
        );
        break;

      default:
        throw new BadRequestError("Invalid role. Must be CLIENT or ARTISAN");
    }

    try {
      // Save user first
      await this.userRepository.save(user);

      // Generate verification token and send verification email
      const verificationToken = this.tokenService.generateVerificationToken(
        user.id
      );
      user.setEmailVerificationToken(verificationToken);

      // Update user with verification token
      await this.userRepository.save(user);

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken
      );

      // Publish all events
      const publishPromises = eventsToPublish.map(
        async ({ channel, event }) => {
          if (channel === "artisan_events") {
            const ackPromise = this.setupEventAcknowledgment(event.id);
            this.pendingEvents.set(event.id, ackPromise);
          }

          await this.eventBus.publish(channel, event);

          if (channel === "artisan_events") {
            try {
              const ack = await Promise.race([
                this.pendingEvents.get(event.id)!,
                this.timeout(8000),
              ]);
              this.pendingEvents.delete(event.id);

              if (ack && ack.status === "failed") {
                console.error(`Event processing failed: ${ack.error}`);
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

      return { user };
    } catch (err: any) {
      // Clean up pending events on error
      eventsToPublish.forEach(({ event }) => {
        this.pendingEvents.delete(event.id);
      });
      throw new BadRequestError(`User registration failed: ${err.message}`);
    }
  }
}
