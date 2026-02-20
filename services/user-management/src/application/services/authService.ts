import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { IAuthService } from "../../interfaces/IUserService";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { TokenService } from "../../infrastructure/services/tokenService";
import { UserAggregate } from "../../domain/aggregates/userAggregate";

import { NotAuthorizeError } from "@fixserv-colauncha/shared";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Password } from "../../domain/value-objects/password";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService,
    private emailService: IEmailService,
  ) {}
  /*
  async login(
    email: string,
    password: string
  ): Promise<{ user: UserAggregate; BearerToken: string }> {
    if (!password) {
      throw new BadRequestError("Password is required");
    }
    const cacheKey = `user:email:${email}`;
    await connectRedis();

    const cachedUser = await redis.get(cacheKey);

    let user: UserAggregate;

    if (cachedUser) {
      user = UserAggregate.fromJSON(JSON.parse(cachedUser));
    } else {
      const foundUser = await this.userRepository.findByEmail(email);
      if (!foundUser) {
        throw new BadRequestError("No user with that email exists");
      }
      user = foundUser;

      // Cache the user data for 10 minutes
      await redis.set(cacheKey, JSON.stringify(user.toJSON()), {
        EX: 60 * 10,
      });
    }

    const passwordData = Password.fromHash(user.password);

    const isMatch = await passwordData.compare(password);

    if (!isMatch) {
      throw new NotAuthorizeError();
    }
    // Optional: Check if email is verified before allowing login
    if (!user.isEmailVerified) {
      throw new BadRequestError("Email not verified");
    }

    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role
    );

    return { user, BearerToken };
  }
    */
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

    const passwordData = Password.fromHash(foundUser.password);
    const isMatch = await passwordData.compare(password);

    if (!isMatch) {
      throw new NotAuthorizeError();
    }

    // Check if email is verified AFTER password validation
    if (!foundUser.isEmailVerified) {
      throw new BadRequestError("Email not verified");
    }

    // Update cache with fresh user data after successful login
    const cacheKey = `user:email:${email}`;
    const userIdCacheKey = `user:${foundUser.id}`;

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

    return { user: foundUser, BearerToken };
  }

  async findUserById(id: string): Promise<UserAggregate> {
    const cacheKey = `user:${id}`;
    await connectRedis();

    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        console.log(`Cache HIT for user:${id}`);
        return UserAggregate.fromJSON(JSON.parse(cachedUser));
      }

      console.log(`Cache MISS for user:${id}`);
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
    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        console.log(`Cache HIT for user with email:${email}`);
        return UserAggregate.fromJSON(JSON.parse(cachedUser));
      }

      console.log(`Cache MISS for user with email:${email}`);
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

  /*
  async verifyGoogleToken(token: string) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("Received token for audience:", payload?.aud);
    console.log("Expected audience:", process.env.GOOGLE_CLIENT_ID);
    if (!payload || !payload.email) {
      throw new BadRequestError("Invalid Google token");
    }
    return {
      email: payload.email,
      fullName: payload.name || "",
    };
  }
*/
  private async verifyGoogleToken(idToken: string): Promise<{
    email: string;
    fullName: string;
    picture?: string;
    emailVerified: boolean;
  }> {
    try {
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
  ): Promise<{ user: UserAggregate; BearerToken: string }> {
    const { email, fullName } = await this.verifyGoogleToken(idToken);
    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      const password = await Password.create(Math.random().toString(36)); //dummy
      user = UserAggregate.createClient(
        uuidv4(),
        new Email(email),
        password,
        fullName,
        "",
        new DeliveryAddress(
          "", // street
          "", // city
          "", // postalCode
          "", // state
          "", // country
        ),
        new ServicePreferences([]),
      );
      await this.userRepository.save(user);
    }
    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role,
    );
    return { user, BearerToken };
  }
    */
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

  async handleGoogleCallback(
    code: string,
    state?: string,
  ): Promise<{ user: UserAggregate; BearerToken: string; isNewUser: boolean }> {
    try {
      // Exchange code for tokens
      const { tokens } = await client.getToken(code);

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

  /**
   * Alternative: Get Google Auth URL for redirect flow
   */
  getGoogleAuthUrl(role?: "CLIENT" | "ARTISAN" | "ADMIN"): string {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: role, // Pass role in state parameter
      prompt: "consent",
    });

    return authUrl;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`;
    await connectRedis();
    await redis.del(cacheKey);
    console.log(`Cache invalidated for user:${userId}`);
  }

  async invalidateEmailCache(email: string): Promise<void> {
    const cacheKey = `user:email:${email}`;
    await connectRedis();
    await redis.del(cacheKey);
    console.log(`Cache invalidated for email:${email}`);
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
}
