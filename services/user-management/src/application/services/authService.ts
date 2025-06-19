import { IAuthService } from "../../interfaces/IUserService";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { TokenService } from "../../infrastructure/services/tokenService";
import { UserAggregate } from "../../domain/aggregates/userAggregate";

import { NotAuthorizeError } from "@fixserv-colauncha/shared";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Password } from "../../domain/value-objects/password";

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
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestError("No user with that email exists");
    }

    const passwordData = Password.fromHash(user.password);
    const isMatch = await passwordData.compare(password);
    if (!isMatch) {
      throw new NotAuthorizeError();
    }

    //check if email is verified

    const BearerToken = this.tokenService.generateBearerToken(
      user.id,
      user.email,
      user.role
    );

    return { user, BearerToken };
  }

  async findUserById(id: string): Promise<UserAggregate> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BadRequestError("User with that Id not found");
    }
    return user;
  }
}
