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
          { upsert: true, new: true }
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

    userData = await ClientModel.findById(id);
    if (userData) return this.toDomain(userData);

    userData = await ArtisanModel.findById(id);
    if (userData) return this.toDomain(userData);

    userData = await AdminModel.findById(id);
    if (userData) return this.toDomain(userData);

    return null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    let userData: any;
    console.log(userData);
    console.log(`Searching for email: ${email}`);

    userData = await ClientModel.findOne({ email });
    if (userData) return this.toDomain(userData);

    userData = await ArtisanModel.findOne({ email });
    console.log("Artisan result:", userData);
    if (userData) return this.toDomain(userData);

    userData = await AdminModel.findOne({ email });
    if (userData) return this.toDomain(userData);
    return null;

    // Add error handling and detailed logging
  }

  private toPersistence(user: UserAggregate): any {
    const base = {
      _id: user.id,
      email: user.email,
      password: user.password,
      role: user.role,
      fullName: user.fullName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (user.role === "CLIENT") {
      return {
        ...base,
        deliveryAddress: user.deliveryAddress,
        servicePreferences: user.servicePreferences,
      };
    } else if (user.role === "ARTISAN") {
      return {
        ...base,
        businessName: user.businessName,
        skillSet: user.skills,
        businessHours: user.businessHours,
        location: user.location,
        rating: user.rating,
      };
    } else if (user.role === "ADMIN") {
      return {
        ...base,
        permissions: user.permissions,
      };
    }
  }

  private toDomain(data: any): UserAggregate {
    console.log("raw data", data);
    if (data.role === "CLIENT") {
      return UserAggregate.createClient(
        data._id.toString(),
        new Email(data.email),
        data.fullName,
        Password.fromHash(data.password),
        new DeliveryAddress(
          data.deliveryAddress.street,
          data.deliveryAddress.city,
          data.deliveryAddress.postalCode,
          data.deliveryAddress.state,
          data.deliveryAddress.country
        ),
        new ServicePreferences(data.servicePreferences)
      );
    } else if (data.role === "ARTISAN") {
      return UserAggregate.createArtisan(
        data._id.toString(),
        new Email(data.email),
        data.fullName,
        Password.fromHash(data.password),
        data.businessName,
        data.rating,
        data.location,
        new SkillSet(data.skills),
        new BusinessHours(data.businessHours) as any
      );
    } else if (data.role === "ADMIN") {
      return UserAggregate.createAdmin(
        data._id.toString(),
        new Email(data.email),
        data.fullName,
        Password.fromHash(data.password),
        data.permissions
      );
    }
    throw new Error(`Unknown role ${data.role}`);
  }
}
