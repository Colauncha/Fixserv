import { Request, Response } from "express";
import { AuthService } from "../../application/services/authService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { validateUpdateRequest } from "../middlewares/validateUpdateRequest";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { SkillSet } from "../../domain/value-objects/skillSet";

export class AuthController {
  private userRepository = new UserRepositoryImpl();

  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError("Email and password are required");
      }
      const { user, sessionToken } = await this.authService.login(
        email,
        password
      );

      req.session = { jwt: sessionToken };

      res.status(200).json(user);
    } catch (error) {
      // throw new NotAuthorizeError();
      console.log(error);
      res.status(404).send(error);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.session?.jwt;

      await this.authService.logout(sessionToken);
      req.session = null;
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
      res.status(200).json(existingUser);
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
    if (updates.password) user.changePassword(user.password, updates.password);

    let skillsArray = updates.skillSet;
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
}
