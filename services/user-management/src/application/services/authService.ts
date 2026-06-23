import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { IAuthService } from "../../interfaces/IUserService";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { TokenService } from "../../infrastructure/services/tokenService";
import { UserAggregate } from "../../domain/aggregates/userAggregate";

import { NotAuthorizeError } from "@fixserv-colauncha/shared";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Password } from "../../domain/value-objects/password";
import {
  redis,
  connectRedis,
  EventAck,
  RedisEventBus,
  publishActivity,
  ACTIVITY_ACTIONS,
} from "@fixserv-colauncha/shared";
import { ArtisanCreatedEvent } from "../../events/artisanCreatedEvent";
import { UserCreatedEvent } from "../../events/userCreatedEvent";
import { IEmailService } from "../../infrastructure/services/emailService";
import { Email } from "../../domain/value-objects/email";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { ServicePreferences } from "../../domain/value-objects//servicePreferences";
import { Categories } from "../../domain/value-objects/categories";
import { Category } from "../../domain/value-objects/category";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { Certificates } from "../../domain/value-objects/certificates";
import { SkillSet } from "../../domain/value-objects/skillSet";
import crypto from "crypto";

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

export class AuthService implements IAuthService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private pendingEvents = new Map<string, Promise<EventAck>>();
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService,
    private emailService: IEmailService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserAggregate; BearerToken: string }> {
    if (!password) {
      throw new BadRequestError("Password is required");
    }

    await connectRedis();

    // ALWAYS fetch fresh user data for login to avoid cache issues
    const foundUser = await this.userRepository.findByEmail(email);
    if (!foundUser) {
      throw new BadRequestError("No user with that email exists");
    }

    foundUser.updateLastActiveAt();
    await this.userRepository.save(foundUser);

    const passwordData = Password.fromHash(foundUser.password);
    const isMatch = await passwordData.compare(password);

    if (!isMatch) {
      throw new NotAuthorizeError();
    }

    // 🔥 CHECK AND AUTO-LIFT EXPIRED SUSPENSIONS HERE 🔥
    // This will unsuspend the user if their suspension period has passed
    const isActuallySuspended = foundUser.checkAndUpdateExpiredSuspension();

    // If auto-unsuspension happened, save the changes to database
    if (!isActuallySuspended && foundUser.isSuspended === false) {
      await this.userRepository.save(foundUser);
    }

    //check suspension
    // if (foundUser.isSuspended) {
    if (isActuallySuspended) {
      const untilText = foundUser.suspendedUntil
        ? `until ${foundUser.suspendedUntil.toLocaleDateString()}`
        : "indefinitely";

      throw new BadRequestError(
        `Your account has been suspended ${untilText}. Reason: ${
          foundUser.suspensionReason || "No reason provided"
        }`,
      );
    }

    // Check if email is verified AFTER password validation
    if (!foundUser.isEmailVerified) {
      throw new BadRequestError("Email not verified");
    }

    // Update cache with fresh user data after successful login
    const cacheKey = `user:email:${email}`;
    const userIdCacheKey = `user:${foundUser.id}`;

    if (!redis) {
      throw new Error("Not initialized");
    }
    await redis.set(cacheKey, JSON.stringify(foundUser.toJSON()), {
      EX: 60 * 10, // 10 minutes
    });
    await redis.set(userIdCacheKey, JSON.stringify(foundUser.toJSON()), {
      EX: 60 * 10, // 10 minutes
    });

    const BearerToken = this.tokenService.generateBearerToken(
      foundUser.id,
      foundUser.email,
      foundUser.role,
    );

    await publishActivity({
      action: ACTIVITY_ACTIONS.USER_LOGGED_IN,
      actorId: foundUser.id,
      actorRole: foundUser.role as any,
      service: "user-management",
      metadata: { email: foundUser.email },
    });

    return { user: foundUser, BearerToken };
  }

  async findUserById(id: string): Promise<UserAggregate> {
    const cacheKey = `user:${id}`;
    await connectRedis();

    try {
      if (!redis) {
        throw new Error("Not initialized");
      }
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        console.log(`Cache HIT for user:${id}`);
        return UserAggregate.fromJSON(JSON.parse(cachedUser));
      }

      // console.log(`Cache MISS for user:${id}`);
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new BadRequestError("User with that Id not found");
      }

      // Cache the fresh data
      await redis.set(cacheKey, JSON.stringify(user.toJSON()), {
        EX: 60 * 10, // 10 minutes
      });

      return user;
    } catch (error) {
      console.error(`Error finding user ${id}:`, error);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserAggregate> {
    const cacheKey = `user:email:${email}`;
    await connectRedis();
    if (!redis) {
      throw new Error("Not initialized");
    }
    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        // console.log(`Cache HIT for user with email:${email}`);
        return UserAggregate.fromJSON(JSON.parse(cachedUser));
      }

      // console.log(`Cache MISS for user with email:${email}`);
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new BadRequestError("User with that email not found");
      }

      // Cache the fresh data
      await redis.set(cacheKey, JSON.stringify(user.toJSON()), {
        EX: 60 * 10, // 10 minutes
      });

      return user;
    } catch (error) {
      console.error(`Error finding user with email ${email}:`, error);
      throw error;
    }
  }

  async getAllUsers(
    role?: string,
    page = 1,
    limit = 10,
  ): Promise<{ users: UserAggregate[]; total: number }> {
    const result = await this.userRepository.find(role, page, limit);
    if (!result) {
      throw new BadRequestError("No users found");
    }
    return result;
  }

  public async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await new Promise((r) => setTimeout(r, 400));
      return;
    }

    const token = this.tokenService.generatePasswordResetToken(user.id);

    await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = this.tokenService.validatePasswordResetToken(token);

    if (!userId) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    await user.setPassword(newPassword);

    await this.userRepository.save(user);
  }

  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    fullName: string;
    picture?: string;
    emailVerified: boolean;
  }> {
    try {
      if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error("GOOGLE_CLIENT_ID not configured");
      }

      console.log(
        "Verifying token with client ID:",
        process.env.GOOGLE_CLIENT_ID,
      );

      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID, // ⭐ This must match your app's client ID
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new BadRequestError("Invalid Google token payload");
      }

      if (!payload.email) {
        throw new BadRequestError("Email not provided by Google");
      }

      return {
        email: payload.email,
        fullName: payload.name || payload.email.split("@")[0],
        picture: payload.picture,
        emailVerified: payload.email_verified || false,
      };
    } catch (error: any) {
      console.error("Google token verification error:", error.message);
      throw new BadRequestError("Invalid Google token");
    }
  }
  /*
  async loginWithGoogle(
    idToken: string,
    role?: "CLIENT" | "ARTISAN" | "ADMIN", // Optional: specify role during signup
  ): Promise<{ user: UserAggregate; BearerToken: string; isNewUser: boolean }> {
    // Verify the Google token
    const { email, fullName, picture, emailVerified } =
      await this.verifyGoogleToken(idToken);

    // Check if user exists
    let user = await this.userRepository.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;

      // Generate a secure random password (user won't need it)
      const randomPassword = await Password.create(
        crypto.randomBytes(32).toString("hex"),
      );

      // Determine role (default to CLIENT if not specified)
      const userRole = role;

      // Create user based on role
      if (userRole === "CLIENT") {
        user = UserAggregate.createClient(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          "",
          new DeliveryAddress("", "", "", "", ""),
          new ServicePreferences([]),
          picture || "",
          [],
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      } else if (userRole === "ARTISAN") {
        user = UserAggregate.createArtisan(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          // picture || "",
          "", // phone
          "", // business name
          "", // location
          0, // default rating
          new SkillSet([]), // skill set
          new BusinessHours({}), // business hours
          new Categories([]),
          new Certificates([]),
          picture || "",
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      } else if (userRole === "ADMIN") {
        user = UserAggregate.createAdmin(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          // picture || "",
          "",
          [],
          picture || "",
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      }

      // Mark email as verified (Google already verified it)
      //if (emailVerified) {
      //  user.markEmailAsVerified();
      //}

      await this.userRepository.save(user!);

      console.log(`✅ New user created via Google: ${email} (${userRole})`);

      // Send welcome email (non-blocking)
      if (emailVerified) {
        //  const verificationToken = this.tokenService.//generateVerificationToken(
        //    user!.id,
        //  );
        //  user!.setEmailVerificationToken//(verificationToken);
        this.emailService
          .sendWaitlistWelcomeEmail(email, fullName)
          .catch((error) => {
            console.error("Failed to send welcome email:", error.message);
          });
      }
    } else {
      console.log(`✅ Existing user logged in via Google: ${email}`);

      // Update profile picture if it changed
      if (picture && user.profilePicture !== picture) {
        user.updateProfilePicture(picture);
        await this.userRepository.save(user);
      }
      // If email wasn't verified before but is now verified by Google
      if (!user.isEmailVerified && emailVerified) {
        user.markEmailAsVerified();
        await this.userRepository.save(user);
      }
    }

    // Generate JWT token
    if (!user) {
      throw new BadRequestError("User creation failed");
    }

    const BearerToken = this.tokenService.generateBearerToken(
      user!.id,
      user!.email,
      user!.role,
    );

    return { user, BearerToken, isNewUser };
  }
  */

  async handleGoogleCallback(
    code: string,
    state?: string,
  ): Promise<{ user: UserAggregate; BearerToken: string; isNewUser: boolean }> {
    try {
      // Exchange code for tokens
      // const { tokens } = await client.getToken(code);
      const { tokens } = await client.getToken({
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI, // Ensure this matches the redirect URI used in getGoogleAuthUrl
      });

      if (!tokens.id_token) {
        throw new BadRequestError("No ID token received from Google");
      }

      // Extract role from state parameter
      const role = (state as "CLIENT" | "ARTISAN" | "ADMIN") || "CLIENT";

      // Login/register user
      return await this.loginWithGoogle(tokens.id_token, role);
    } catch (error: any) {
      console.error("Google callback error:", error.message);
      throw new BadRequestError("Failed to authenticate with Google");
    }
  }

  // Add this temporary debug function
  private debugGoogleConfig() {
    console.log("Google OAuth Configuration:", {
      clientId: process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ MISSING",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ MISSING",
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      frontend: process.env.FIXSERV_FRONTEND,
      nodeEnv: process.env.NODE_ENV,
    });
  }

  /**
   * Alternative: Get Google Auth URL for redirect flow
   */
  getGoogleAuthUrl(role?: "CLIENT" | "ARTISAN" | "ADMIN"): string {
    this.debugGoogleConfig();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    console.log("Generating Google auth URL with redirect_uri:", redirectUri);
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ];

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: role, // Pass role in state parameter
      prompt: "consent",
      redirect_uri: redirectUri,
    });
    console.log("Generated auth URL:", authUrl);
    return authUrl;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`;
    await connectRedis();
    if (!redis) {
      throw new Error("Not initialized");
    }
    await redis.del(cacheKey);
    console.log(`Cache invalidated for user:${userId}`);
  }

  async invalidateEmailCache(email: string): Promise<void> {
    const cacheKey = `user:email:${email}`;
    await connectRedis();
    if (!redis) {
      throw new Error("Not initialized");
    }
    await redis.del(cacheKey);
    // console.log(`Cache invalidated for email:${email}`);
  }

  async refreshUserCache(userId: string): Promise<UserAggregate> {
    await this.invalidateUserCache(userId);
    return await this.findUserById(userId);
  }

  validatePasswordResetToken(token: string): string | null {
    try {
      return this.tokenService.validatePasswordResetToken(token);
    } catch (error) {
      return null;
    }
  }

  // Add this method for email verification
  async markEmailAsVerified(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("User not found");
    }

    user.markEmailAsVerified();
    await this.userRepository.save(user);

    // CRITICAL: Invalidate both caches after email verification
    await this.invalidateUserCache(userId);
    await this.invalidateEmailCache(user.email);

    console.log(`Email verified and cache invalidated for user: ${userId}`);
  }

  async updateArtisanCategories(
    artisanId: string,
    categories: any[],
  ): Promise<UserAggregate> {
    // Fetch artisan
    const artisan = await this.findUserById(artisanId);

    if (!artisan) {
      throw new BadRequestError("Artisan not found");
    }

    if (artisan.role !== "ARTISAN") {
      throw new BadRequestError("User is not an artisan");
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      throw new BadRequestError("Categories array cannot be empty");
    }

    // Normalize categories (important) -> build string[] of category names expected by Categories
    // const normalizedCategoryNames = categories.map//((cat) =>
    //   cat.name.toUpperCase(),
    // );

    const normalizedCategories = categories.map((cat) => ({
      name: cat.name.toUpperCase(),
      description: cat.description ?? "",
      iconUrl: cat.iconUrl ?? null,
    }));

    // Use aggregate method (DDD-safe)
    // artisan.updateCategories(new Categories(normalizedCategories));
    const categoryVOs = normalizedCategories.map(
      (cat) =>
        new Category(cat.name, cat.description, cat.iconUrl ?? undefined),
    );

    artisan.updateCategories(new Categories(categoryVOs));

    // Persist
    await this.userRepository.save(artisan);

    // Cache invalidation (same pattern you already use)
    await this.invalidateUserCache(artisan.id);
    await this.invalidateEmailCache(artisan.email);

    // Re-fetch fresh copy
    const freshArtisan = await this.findUserById(artisan.id);

    if (!freshArtisan) {
      throw new BadRequestError("Failed to reload artisan");
    }

    return freshArtisan;
  }

  async loginWithGoogle(
    idToken: string,
    role?: "CLIENT" | "ARTISAN" | "ADMIN",
  ): Promise<{ user: UserAggregate; BearerToken: string; isNewUser: boolean }> {
    const { email, fullName, picture, emailVerified } =
      await this.verifyGoogleToken(idToken);

    let user = await this.userRepository.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      const randomPassword = await Password.create(
        crypto.randomBytes(32).toString("hex"),
      );

      const userRole = role || "CLIENT";

      if (userRole === "CLIENT") {
        user = UserAggregate.createClient(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          "",
          new DeliveryAddress("", "", "", "", ""),
          new ServicePreferences([]),
          picture || "",
          [],
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      } else if (userRole === "ARTISAN") {
        user = UserAggregate.createArtisan(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          "",
          "",
          "",
          0,
          new SkillSet([]),
          new BusinessHours({}),
          new Categories([]),
          new Certificates([]),
          picture || "",
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      } else if (userRole === "ADMIN") {
        user = UserAggregate.createAdmin(
          uuidv4(),
          new Email(email),
          randomPassword,
          fullName,
          "",
          [],
          picture || "",
          emailVerified,
          null,
          emailVerified ? new Date() : null,
        );
      }

      await this.userRepository.save(user!);
      console.log(`✅ New user created via Google: ${email} (${userRole})`);

      // Publish events so wallet + notifications are created
      // exactly like registerUser does
      try {
        const eventsToPublish: any[] = [];

        const userCreatedEvent = new UserCreatedEvent({
          userId: user!.id,
          email: user!.email,
          fullName: user!.fullName,
          role: userRole,
          referralCode: undefined, // no referral for Google signup
          additionalData:
            userRole === "CLIENT"
              ? { servicePreferences: [] }
              : userRole === "ARTISAN"
                ? { businessName: "", skills: [], location: "" }
                : {},
        });

        eventsToPublish.push({
          channel: "user_events",
          event: userCreatedEvent,
        });

        // Also publish ArtisanCreatedEvent for artisans
        if (userRole === "ARTISAN") {
          const artisanEvent = new ArtisanCreatedEvent({
            userId: user!.id,
            fullName: user!.fullName,
            skills: [],
            businessName: "",
            location: "",
            rating: 0,
            categories: [],
          });
          eventsToPublish.push({
            channel: "artisan_events",
            event: artisanEvent,
          });
        }

        // Publish all events — same logic as registerUser
        const publishPromises = eventsToPublish.map(
          async ({ channel, event }) => {
            if (channel === "artisan_events") {
              const ackPromise = this.setupEventAcknowledgment(event.id);
              this.pendingEvents.set(event.id, ackPromise);
            }

            if (channel === "user_events") {
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
                  `Event acknowledgment timeout for event ${event.id}`,
                );
                this.pendingEvents.delete(event.id);
              }
            }
          },
        );

        await Promise.all(publishPromises);
        console.log(`✅ Events published for Google user: ${email}`);
      } catch (eventError: any) {
        // Non-fatal — user is created, events failed
        // Log for monitoring but don't fail the login
        console.error(
          `⚠️ Failed to publish events for Google user ${email}:`,
          eventError.message,
        );
      }

      // Send welcome email non-blocking
      if (emailVerified) {
        this.emailService
          .sendWaitlistWelcomeEmail(email, fullName)
          .catch((error) => {
            console.error("Failed to send welcome email:", error.message);
          });
      }
    } else {
      console.log(`✅ Existing user logged in via Google: ${email}`);

      if (picture && user.profilePicture !== picture) {
        user.updateProfilePicture(picture);
        await this.userRepository.save(user);
      }

      if (!user.isEmailVerified && emailVerified) {
        user.markEmailAsVerified();
        await this.userRepository.save(user);
      }
    }

    if (!user) {
      throw new BadRequestError("User creation failed");
    }

    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role,
    );

    return { user, BearerToken, isNewUser };
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
        },
      );
    });
  }
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout reached")), ms),
    );
  }

  async getDashboardUserStats(
    period: "today" | "week" | "month" = "today",
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const [totalUsers, activeArtisans, newSignups, activeClients] =
      await Promise.all([
        this.userRepository.getTotalUsers(),
        this.userRepository.getActiveArtisans(page, limit, search),
        this.userRepository.getNewSignups(period, page, limit),
        this.userRepository.getActiveClients(page, limit, search),
      ]);

    return {
      totalUsers,
      activeArtisans,
      newSignups,
      activeClients,
    };
  }

  async getManageUsers(
    page = 1,
    limit = 20,
    role?: "CLIENT" | "ARTISAN",
    search?: string,
  ) {
    return this.userRepository.getManageUsers(page, limit, role, search);
  }

  async suspendUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    suspendedUntil?: Date, // optional — omit for indefinite
  ): Promise<UserAggregate> {
    const user = await this.userRepository.findById(targetUserId);
    if (!user) throw new BadRequestError("User not found");

    if (user.role === "ADMIN") {
      throw new BadRequestError("Admin accounts cannot be suspended");
    }

    if (user.isSuspended) {
      throw new BadRequestError("User is already suspended");
    }

    user.suspend(reason, adminId, suspendedUntil);
    await this.userRepository.save(user);

    // Invalidate cache so suspended status is immediately enforced
    await this.invalidateUserCache(targetUserId);
    await this.invalidateEmailCache(user.email);

    // Emit event → notification-service notifies the user
    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.publish("user_events", {
        eventName: "AccountSuspendedEvent",
        payload: {
          userId: targetUserId,
          role: user.role,
          reason,
          suspendedUntil: suspendedUntil ?? null,
          suspendedBy: adminId,
          suspendedAt: new Date(),
        },
      });

      await publishActivity({
        action: ACTIVITY_ACTIONS.USER_SUSPENDED,
        actorId: adminId,
        actorRole: "ADMIN",
        targetId: targetUserId,
        targetType: "USER",
        service: "user-management",
        metadata: { reason, suspendedUntil: suspendedUntil ?? null },
      });
    } catch (eventError) {
      console.error("Failed to emit AccountSuspendedEvent:", eventError);
    }

    return user;
  }

  async unsuspendUser(
    targetUserId: string,
    adminId: string,
  ): Promise<UserAggregate> {
    const user = await this.userRepository.findById(targetUserId);
    if (!user) throw new BadRequestError("User not found");

    if (!user.isSuspended) {
      throw new BadRequestError("User is not currently suspended");
    }

    user.unsuspend();
    await this.userRepository.save(user);

    await this.invalidateUserCache(targetUserId);
    await this.invalidateEmailCache(user.email);

    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.publish("user_events", {
        eventName: "AccountUnsuspendedEvent",
        payload: {
          userId: targetUserId,
          role: user.role,
          reinstatedBy: adminId,
          reinstatedAt: new Date(),
        },
      });

      await publishActivity({
        action: ACTIVITY_ACTIONS.USER_UNSUSPENDED,
        actorId: adminId,
        actorRole: "ADMIN",
        targetId: targetUserId,
        targetType: "USER",
        service: "user-management",
      });
    } catch (eventError) {
      console.error("Failed to emit AccountUnsuspendedEvent:", eventError);
    }

    return user;
  }

  async getSuspendedUsers(
    page = 1,
    limit = 20,
    role?: "CLIENT" | "ARTISAN",
  ): Promise<{ users: UserAggregate[]; total: number }> {
    return this.userRepository.findSuspendedUsers(page, limit, role);
  }
}
