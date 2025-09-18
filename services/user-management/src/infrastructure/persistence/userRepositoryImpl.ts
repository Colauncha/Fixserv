import { Model } from "mongoose";
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
import { BadRequestError } from "@fixserv-colauncha/shared";

export class UserRepositoryImpl implements IUserRepository {
  /*
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
    */
  async save(user: UserAggregate): Promise<UserAggregate> {
    const userData = this.toPersistence(user);
    const role = user.role;

    console.log(`Saving user ${user.id} with role ${role}`);
    console.log("User data being saved:", JSON.stringify(userData, null, 2));

    let savedData: any;

    switch (role) {
      case "CLIENT":
        savedData = await ClientModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" }
        );
        break;

      case "ARTISAN":
        savedData = await ArtisanModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" }
        );
        break;

      case "ADMIN":
        savedData = await AdminModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" }
        );
        break;

      default:
        throw new Error(`Unknown role ${role}`);
    }

    console.log("Data saved to database:", JSON.stringify(savedData, null, 2));

    if (!savedData.role) {
      savedData.role = role; // Ensure role is set if not present
    }

    // Return the updated user aggregate
    return this.toDomain(savedData);
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

  async find(
    role?: string,
    page = 1,
    limit = 10
  ): Promise<{ users: UserAggregate[]; total: number }> {
    const skip = (page - 1) * limit;

    let model: Model<any> | null = null;
    if (role === "CLIENT") model = ClientModel;
    else if (role === "ARTISAN") model = ArtisanModel;
    else if (role === "ADMIN") model = AdminModel;

    if (model) {
      const [docs, total] = await Promise.all([
        model.find().skip(skip).limit(limit).select("+password").lean(),
        model.countDocuments(),
      ]);

      const users = docs.map((doc) => this.toDomain({ ...doc, role }));
      return { users, total };
    }

    // If no role specified, paginate all combined (less efficient)
    const [clients, artisans, admins] = await Promise.all([
      ClientModel.find().select("+password").lean(),
      ArtisanModel.find().select("+password").lean(),
      AdminModel.find().select("+password").lean(),
    ]);

    const allUsers = [
      ...(clients?.map((c) => this.toDomain({ ...c, role: "CLIENT" })) || []),
      ...(artisans?.map((a) => this.toDomain({ ...a, role: "ARTISAN" })) || []),
      ...(admins?.map((a) => this.toDomain({ ...a, role: "ADMIN" })) || []),
    ];

    const total = allUsers.length;
    const paginatedUsers = allUsers.slice(skip, skip + limit);

    return { users: paginatedUsers, total };
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
  /*
  async addUploadedProduct(clientId: string, product: any): Promise<void> {
    await ClientModel.findOneAndUpdate(
      { _id: clientId },
      {
        $push: { uploadedProducts: product },
      },
      { new: true }
    ).exec();
  }
    */
  async addUploadedProduct(clientId: string, product: any): Promise<void> {
    console.log(`Adding product for client ${clientId}:`, product);

    // Get current user
    const user = await this.findById(clientId);
    if (!user) {
      throw new BadRequestError("Client not found");
    }

    // Add the product
    const currentProducts = user.uploadedProducts || [];
    const updatedProducts = [...currentProducts, product];
    user.setUploadedProducts(updatedProducts);

    // Save to database
    await this.save(user);

    console.log(`Product added successfully for client ${clientId}`);
  }

  private toPersistence(user: UserAggregate): any {
    const base = {
      _id: user.id,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      profilePicture: user.profilePicture || null,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      emailVerificationToken: user.emailVerificationToken,
      emailVerifiedAt: user.isEmailVerified ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (user.role === "CLIENT") {
      return {
        ...base,
        deliveryAddress: user.deliveryAddress,
        servicePreferences: user.servicePreferences.categories,
        uploadedProducts: user.uploadedProducts || [],
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

  /*
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
        ),
        data.profilePicture,
        data.uploadedProducts || []
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
        new BusinessHours(data.businessHours),
        data.profilePicture
      );
    } else if (data.role === "ADMIN") {
      return UserAggregate.createAdmin(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.permissions,
        data.profilePicture
      );
    }
    throw new Error(`Unknown role ${data.role}`);
  }
    */
  /*
  private toDomain(data: any): UserAggregate {
    if (data.role === "CLIENT") {
      console.log(
        "Database uploadedProducts:",
        data.uploadedProducts?.length || 0
      );
      console.log(
        "Raw uploadedProducts:",
        JSON.stringify(data.uploadedProducts, null, 2)
      );

      // Create the client with ALL required fields including profilePicture and uploadedProducts
      const client = UserAggregate.createClient(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        new DeliveryAddress(
          data.deliveryAddress?.street || "",
          data.deliveryAddress?.city || "",
          data.deliveryAddress?.postalCode || "",
          data.deliveryAddress?.state || "",
          data.deliveryAddress?.country || ""
        ),
        new ServicePreferences(
          Array.isArray(data.servicePreferences) ? data.servicePreferences : []
        ),
        data.profilePicture, // CRITICAL: Pass profilePicture from database
        data.uploadedProducts || [] // CRITICAL: Pass uploadedProducts from database
      );

      return client;
    } else if (data.role === "ARTISAN") {
      const skills = Array.isArray(data.skillSet)
        ? data.skillSet
        : ["General Repair"];

      return UserAggregate.createArtisan(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        data.businessName || "",
        data.location || "",
        data.rating || 0,
        new SkillSet(skills),
        new BusinessHours(data.businessHours || {}),
        data.profilePicture // CRITICAL: Pass profilePicture from database
      );
    } else if (data.role === "ADMIN") {
      return UserAggregate.createAdmin(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        data.permissions || [],
        data.profilePicture // CRITICAL: Pass profilePicture from database
      );
    }

    throw new Error(`Unknown role ${data.role}`);
  }
*/
  private toDomain(data: any): UserAggregate {
    let user: UserAggregate;

    if (data.role === "CLIENT") {
      console.log(
        "Database uploadedProducts:",
        data.uploadedProducts?.length || 0
      );

      user = UserAggregate.createClient(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        new DeliveryAddress(
          data.deliveryAddress?.street || "",
          data.deliveryAddress?.city || "",
          data.deliveryAddress?.postalCode || "",
          data.deliveryAddress?.state || "",
          data.deliveryAddress?.country || ""
        ),
        new ServicePreferences(
          Array.isArray(data.servicePreferences) ? data.servicePreferences : []
        ),
        data.profilePicture,
        data.uploadedProducts || [],
        data.isEmailVerified,
        data.emailVerificationToken
      );
    } else if (data.role === "ARTISAN") {
      const skills = Array.isArray(data.skillSet)
        ? data.skillSet
        : ["General Repair"];

      user = UserAggregate.createArtisan(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        data.businessName || "",
        data.location || "",
        data.rating || 0,
        new SkillSet(skills),
        new BusinessHours(data.businessHours || {}),
        data.profilePicture,
        data.isEmailVerified,
        data.emailVerificationToken
      );
    } else if (data.role === "ADMIN") {
      user = UserAggregate.createAdmin(
        data._id.toString(),
        new Email(data.email),
        Password.fromHash(data.password),
        data.fullName,
        data.phoneNumber,
        data.permissions || [],
        data.profilePicture,
        data.isEmailVerified,
        data.emailVerificationToken
      );
    } else {
      throw new Error(`Unknown role ${data.role}`);
    }

    // CRITICAL: Restore email verification state from database
    if (data.isEmailVerified) {
      user.markEmailAsVerified();
    }
    if (data.emailVerificationToken) {
      user.setEmailVerificationToken(data.emailVerificationToken);
    }

    return user;
  }
  toJSON(user: UserAggregate): any {
    const base = {
      _id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (user.role === "CLIENT") {
      return {
        ...base,
        deliveryAddress: user.deliveryAddress,
        servicePreferences: user.servicePreferences.categories,
        uploadedProducts: user.uploadedProducts || [],
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
