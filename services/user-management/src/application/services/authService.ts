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
import { EmailService } from "../../infrastructure/services/emailService";
import { Email } from "../../domain/value-objects/email";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { ServicePreferences } from "../../domain/value-objects//servicePreferences";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService,
    private emailService: EmailService
  ) {}

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

    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role
    );

    return { user, BearerToken };
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
    limit = 10
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

  async loginWithGoogle(
    idToken: string
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
          "" // country
        ),
        new ServicePreferences([])
      );
      await this.userRepository.save(user);
    }
    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role
    );
    return { user, BearerToken };
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`;
    await connectRedis();
    await redis.del(cacheKey);
    console.log(`Cache invalidated for user:${userId}`);
  }

  async refreshUserCache(userId: string): Promise<UserAggregate> {
    await this.invalidateUserCache(userId);
    return await this.findUserById(userId);
  }
}
