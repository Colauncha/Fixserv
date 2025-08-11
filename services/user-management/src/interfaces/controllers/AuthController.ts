import { Request, Response } from "express";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
import { AuthService } from "../../application/services/authService";
import { BadRequestError, NotAuthorizeError } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { validateUpdateRequest } from "../middlewares/validateUpdateRequest";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { SkillSet } from "../../domain/value-objects/skillSet";
import { refreshUserCache } from "../../infrastructure/utils/refreshUserCache";

export class AuthController {
  private userRepository = new UserRepositoryImpl();

  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError("Email and password are required");
      }
      const { user, BearerToken } = await this.authService.login(
        email,
        password
      );

      res.cookie("jwt", BearerToken, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      const response = this.userRepository.toJSON(user);

      res.status(200).json({ data: { response, BearerToken } });
    } catch (error) {
      console.error("Login failed:", error);
      throw new BadRequestError("Invalid credentials");
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("jwt", {
        httpOnly: true,
      });
      res.status(200).json({ message: "Logged out successfull" });
    } catch (error) {
      res.status(400).json({ message: "Logout failed" });
    }
  }
  async findUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.authService.findUserById(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: "User not found" });
    }
  }

  async findUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      const user = await this.authService.findUserByEmail(email);
      if (!user) {
        throw new BadRequestError("User not found");
      }
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "User not found" });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { users, total } = await this.authService.getAllUsers(
        role,
        page,
        limit
      );

      res.status(200).json({
        results: users.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        users,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentUser = req.currentUser!;

      if (currentUser.id !== id) {
        throw new BadRequestError("Unauthorized to update this user");
      }

      // Get existing user
      const existingUser = await this.authService.findUserById(id);
      if (!existingUser) {
        throw new BadRequestError("User not found");
      }

      // Validate updates based on role
      validateUpdateRequest(existingUser.role, updates);

      // Apply updates
      const updatedUser = this.applyUpdates(existingUser, updates);

      // Save updated user

      await this.userRepository.save(updatedUser);

      await connectRedis();
      await refreshUserCache(updatedUser);

      res.status(200).json(updatedUser);
    } catch (error: any) {
      res.status(error instanceof BadRequestError ? 400 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  private applyUpdates(user: UserAggregate, updates: any): UserAggregate {
    // Base fields that all users can update
    if (updates.fullName) user.updateFullName(updates.fullName);
    if (updates.phoneNumber) user.updatePhoneNumber(updates.phoneNumber);
    // if (updates.password) user.changePassword(user.password, updates.//password);

    // Role-specific updates
    switch (user.role) {
      case "CLIENT":
        if (updates.deliveryAddress) {
          user.updateDeliveryAddress(
            new DeliveryAddress(
              updates.deliveryAddress.street,
              updates.deliveryAddress.city,
              updates.deliveryAddress.postalCode,
              updates.deliveryAddress.state,
              updates.deliveryAddress.country
            )
          );
        }
        if (updates.servicePreferences) {
          user.updateServicePreferences(
            new ServicePreferences(updates.servicePreferences)
          );
        }
        break;

      case "ARTISAN":
        if (updates.businessName) user.updateBusinessName(updates.businessName);
        if (updates.location) user.updateLocation(updates.location);
        if (updates.skillSet) {
          user.updateSkillSet(new SkillSet(updates.skillSet));
        }
        if (updates.businessHours) {
          user.updateBusinessHours(new BusinessHours(updates.businessHours));
        }
        break;

      case "ADMIN":
        if (updates.permissions && user.role === "ADMIN") {
          user.updatePermissions(updates.permissions);
        }
        break;
    }

    return user;
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };

      if (!email || !email.trim()) {
        throw new BadRequestError("Provide a valid Email");
      }

      await this.authService.requestPasswordReset(email.toLowerCase());

      res.status(200).json({
        message:
          "If there is an account for that Email, a reset link has been sent.",
      });
    } catch (error: any) {
      throw new BadRequestError(error);
    }
  }

  async resetPassword(req: Request, res: Response) {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || typeof token !== "string") {
      throw new BadRequestError("Reset token is required");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError("Password mst be at least 6 characters");
    }
    try {
      await this.authService.resetPassword(token, newPassword);
      res.status(200).json({ message: "Password reset successful" });
    } catch (error: any) {
      console.error("Reset password failed:", error);
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to reset password" });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body;
    if (!idToken) {
      throw new BadRequestError("Missing Google ID token");
    }

    const { user, BearerToken } = await this.authService.loginWithGoogle(
      idToken
    );
    res.status(200).json({
      message: "Google login successful",
      user: this.userRepository.toJSON(user),
      BearerToken,
    });
  }
}
