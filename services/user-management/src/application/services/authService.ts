import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { IAuthService } from "../../interfaces/IUserService";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { TokenService } from "../../infrastructure/services/tokenService";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { BadRequestError } from "../../errors/badRequestError";
import { Password } from "../../domain/value-objects/password";

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService
  ) {}

  async login(
    email: string,
    password: string
  ): Promise<{ user: UserAggregate; sessionToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    console.log("Searching for email:", email);
    console.log(user);
    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }
    const passwordData = Password.fromHash(user.password);
    const isMatch = await passwordData.compare(password);
    if (!isMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    //check if email is verified

    const sessionToken = this.tokenService.generateSessionToken(user.id);

    return { user, sessionToken };
  }

  async logout(sessionToken: string): Promise<void> {
    return;
  }

  async currentUser(): Promise<void> {
    return;
  }
}
