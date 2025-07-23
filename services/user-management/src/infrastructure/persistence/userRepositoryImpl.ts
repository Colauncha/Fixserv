import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { Email } from "../../domain/value-objects/email";
import { Password } from "../../domain/value-objects/password";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { SkillSet } from "../../domain/value-objects/skillSet";
import { AdminModel } from "./models/admin";
import { ArtisanModel } from "./models/artisan";
import { ClientModel } from "./models/client";

export class UserRepositoryImpl implements IUserRepository {
  async save(user: UserAggregate): Promise<void> {
    const userData = this.toPersistence(user);
    const role = user.role;

    switch (role) {
      case "CLIENT":
        await ClientModel.findOneAndUpdate(
          {
            _id: user.id,
          },
          userData,
          { upsert: true, new: true }
        );
        break;

      case "ARTISAN":
        await ArtisanModel.findOneAndUpdate(
          {
            _id: user.id,
          },
          userData,
          {
            upsert: true,
            new: true,
          }
        );
        break;

      case "ADMIN":
        await AdminModel.findOneAndUpdate(
          {
            _id: user.id,
          },
          userData,
          { upsert: true, new: true }
        );
        break;
      default:
        throw new Error(`Unknown role ${role}`);
    }
  }

  async findById(id: string): Promise<UserAggregate | null> {
    let userData: any;

    userData = await ClientModel.findById(id).select("+password");
    if (userData) return this.toDomain(userData);

    userData = await ArtisanModel.findById(id).select("+password");
    if (userData) return this.toDomain(userData);

    userData = await AdminModel.findById(id).select("+password");
    if (userData) return this.toDomain(userData);

    return null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    let userData: any;

    userData = await ClientModel.findOne({ email }).select("+password");
    if (userData) return this.toDomain(userData);

    userData = await ArtisanModel.findOne({ email }).select("+password");
    if (userData) return this.toDomain(userData);

    userData = await AdminModel.findOne({ email }).select("+password");
    if (userData) return this.toDomain(userData);
    return null;
  }

  async updateRating(userId: string, newRating: number): Promise<void> {
    try {
      // Only artisans have ratings
      await ArtisanModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: { rating: newRating },
          $push: {
            ratingHistory: {
              rating: newRating,
              updatedAt: new Date(),
            },
          },
        },
        { new: true }
      ).exec();
    } catch (error: any) {
      throw new Error(
        `Failed to update rating for user ${userId}: ${error.message}`
      );
    }
  }

  private toPersistence(user: UserAggregate): any {
    const base = {
      _id: user.id,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (user.role === "CLIENT") {
      return {
        ...base,
        deliveryAddress: user.deliveryAddress,
        servicePreferences: user.servicePreferences.categories,
      };
    } else if (user.role === "ARTISAN") {
      return {
        ...base,
        businessName: user.businessName,
        location: user.location,
        rating: user.rating,
        skillSet: user.skills.skills,
        businessHours: user.businessHours,
      };
    } else if (user.role === "ADMIN") {
      return {
        ...base,
        permissions: user.permissions,
      };
    }
  }

  private toDomain(data: any): UserAggregate {
    if (data.role === "CLIENT") {
      return UserAggregate.createClient(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        new DeliveryAddress(
          data.deliveryAddress.street,
          data.deliveryAddress.city,
          data.deliveryAddress.postalCode,
          data.deliveryAddress.state,
          data.deliveryAddress.country
        ),
        new ServicePreferences(
          Array.isArray(data.servicePreferences) ? data.servicePreferences : []
        )
      );
    } else if (data.role === "ARTISAN") {
      const skills = Array.isArray(data.skillSet)
        ? data.skillSet
        : ["General Repair"];
      return UserAggregate.createArtisan(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.businessName,
        data.location,
        data.rating,
        new SkillSet(skills),
        new BusinessHours(data.businessHours)
      );
    } else if (data.role === "ADMIN") {
      return UserAggregate.createAdmin(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.permissions
      );
    }
    throw new Error(`Unknown role ${data.role}`);
  }

  toJSON(user: UserAggregate): any {
    const base = {
      _id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (user.role === "CLIENT") {
      return {
        ...base,
        deliveryAddress: user.deliveryAddress,
        servicePreferences: user.servicePreferences.categories,
      };
    } else if (user.role === "ARTISAN") {
      return {
        ...base,
        businessName: user.businessName,
        location: user.location,
        rating: user.rating,
        skillSet: user.skills.skills,
        businessHours: user.businessHours,
      };
    } else if (user.role === "ADMIN") {
      return {
        ...base,
        permissions: user.permissions,
      };
    }
  }
}
