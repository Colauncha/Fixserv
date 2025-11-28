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
      const {
        email,
        password,
        fullName,
        role,
        phoneNumber,
        referralCode,
        ...roleData
      } = req.body;

      const { user } = await this.userService.registerUser(
        email,
        password,
        fullName,
        role,
        phoneNumber,
        referralCode,
        roleData.clientData,
        roleData.artisanData,
        roleData.adminData
      );

      //await resend.emails.send({
      //  from: "fixserv@resend.dev",
      //  to: email,
      //  subject: "Welcome to Fixserv",
      //  html: ` <p>Hi there,</p><strong>Welcome to Fixserv, please Login //to get started.</stro>`,
      //});

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: this.response.toJSON(user),
        referralCode: user.id,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestError("Email already in use");
      }
      throw new BadRequestError(error.message || "User registration failed");
    }
  }
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        throw new BadRequestError("Verification token is required");
      }

      const result = await this.userService.verifyEmail(token);

      //res.status(200).json({
      //  success: true,
      //  message: result.message,
      //});
      res.redirect(`${process.env.FIXSERV_FRONTEND}/auth/login`);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Email verification failed",
      });
    }
  }

  async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email || !email.trim()) {
        throw new BadRequestError("Email is required");
      }

      const result = await this.userService.resendVerificationEmail(
        email.toLowerCase()
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to resend verification email",
      });
    }
  }
  async registerUserWaitlist(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName, role, phoneNumber, password } = req.body;

      const result = await this.userService.registerUserWaitingList(
        email.toLowerCase(),
        password,
        fullName,
        role,
        phoneNumber
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to register user waitlist",
      });
    }
  }
}
