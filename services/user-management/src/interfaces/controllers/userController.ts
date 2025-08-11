import { Request, Response } from "express";
import { UserService } from "../../application/services/userService";

import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { ArtisanModel } from "../../infrastructure/persistence/models/artisan";
import { resend } from "../../infrastructure/services/resendService";

export class UserController {
  private response = new UserRepositoryImpl();
  constructor(private userService: UserService) {}
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role, phoneNumber, ...roleData } =
        req.body;

      const { user } = await this.userService.registerUser(
        email,
        password,
        fullName,
        role,
        phoneNumber,
        roleData.clientData,
        roleData.artisanData,
        roleData.adminData
      );

      await resend.emails.send({
        from: "fixserv@resend.dev",
        to: email,
        subject: "Welcome to Fixserv",
        html: ` <p>Hi there,</p><strong>Welcome to Fixserv, please Login to get started.</stro>`,
      });

      res.status(201).json(this.response.toJSON(user));
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestError("Email already in use");
      }
      throw new BadRequestError(error.message || "User registration failed");
    }
  }
}
