import { IAuthService } from "../../interfaces/IUserService";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { TokenService } from "../../infrastructure/services/tokenService";
import { UserAggregate } from "../../domain/aggregates/userAggregate";

import { NotAuthorizeError } from "@fixserv-colauncha/shared";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Password } from "../../domain/value-objects/password";
import { redis, connectRedis } from "@fixserv-colauncha/shared";

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService
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
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      return UserAggregate.fromJSON(JSON.parse(cachedUser));
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BadRequestError("User with that Id not found");
    }

    await redis.set(cacheKey, JSON.stringify(user.toJSON()), {
      EX: 60 * 10,
    });
    return user;
  }
}
