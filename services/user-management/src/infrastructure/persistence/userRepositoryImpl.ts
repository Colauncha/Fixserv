import { Model } from "mongoose";
import mongoose from "mongoose";
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
import { UserIdentityModel } from "./models/userIdentity";
import {
  BadRequestError,
  connectRedis,
  redis,
} from "@fixserv-colauncha/shared";
import { Categories } from "../../domain/value-objects/categories";
import { Certificates } from "../../domain/value-objects/certificates";
import { Certificate } from "../../domain/value-objects/certificate";

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
  /*
  async save(user: UserAggregate): Promise<UserAggregate> {
    // 1️⃣ Check global uniqueness
    const existingIdentity = await UserIdentityModel.findOne({
      email: user.email,
    });

    if (existingIdentity && existingIdentity.userId !== user.id) {
      throw new BadRequestError("Email already exists");
    }

    const userData = this.toPersistence(user);
    const role = user.role;

    // console.log(`Saving user ${user.id} with role ${role}`);
    // console.log("User data being saved:", JSON.stringify(userData, null, 2));

    let savedData: any;

    switch (role) {
      case "CLIENT":
        savedData = await ClientModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" },
        );
        break;

      case "ARTISAN":
        savedData = await ArtisanModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" },
        );
        break;

      case "ADMIN":
        savedData = await AdminModel.findOneAndUpdate(
          { _id: user.id },
          userData,
          { upsert: true, new: true, select: "+password" },
        );
        break;

      default:
        throw new Error(`Unknown role ${role}`);
    }

    //console.log("Data saved to database:", JSON.//stringify(savedData, null, 2));

    if (!savedData.role) {
      savedData.role = role; // Ensure role is set if not present
    }

    // 3️⃣ Save to identity registry
    await UserIdentityModel.findOneAndUpdate(
      { email: user.email },
      {
        email: user.email,
        userId: user.id,
        role: user.role,
      },
      { upsert: true },
    );

    // Return the updated user aggregate
    return this.toDomain(savedData);
  }*/

  async save(user: UserAggregate): Promise<UserAggregate> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const userData = this.toPersistence(user);
      const role = user.role;
      const normalizedEmail = user.email.toLowerCase().trim();

      // 1️⃣ Check global uniqueness with pessimistic locking
      const existingIdentity = await UserIdentityModel.findOne({
        email: normalizedEmail,
      }).session(session);

      if (existingIdentity) {
        // If identity exists but belongs to the same user (update scenario)
        if (existingIdentity.userId !== user.id) {
          throw new BadRequestError(
            `Email ${normalizedEmail} is already registered as a ${existingIdentity.role}`,
          );
        }
      }

      // 2️⃣ Save to role-specific collection
      let savedData: any;
      let Model: any;

      switch (role) {
        case "CLIENT":
          Model = ClientModel;
          break;
        case "ARTISAN":
          Model = ArtisanModel;
          break;
        case "ADMIN":
          Model = AdminModel;
          break;
        default:
          throw new Error(`Unknown role ${role}`);
      }

      // Check if email exists in other role collections (redundant check)
      const emailExistsInOtherRoles = await this.checkEmailInOtherCollections(
        normalizedEmail,
        role,
        user.id,
        session,
      );

      if (emailExistsInOtherRoles) {
        throw new BadRequestError(
          `Email ${normalizedEmail} is already registered with a different account type`,
        );
      }

      // Perform the upsert
      savedData = await Model.findOneAndUpdate(
        { _id: user.id },
        {
          ...userData,
          email: normalizedEmail, // Ensure normalized email is saved
        },
        {
          upsert: true,
          new: true,
          select: "+password",
          session,
        },
      );

      // 3️⃣ Save to identity registry (primary source of truth)
      await UserIdentityModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
          email: normalizedEmail,
          userId: user.id,
          role: user.role,
          updatedAt: new Date(),
        },
        {
          upsert: true,
          session,
        },
      );

      // Commit transaction
      await session.commitTransaction();

      return this.toDomain(savedData);
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Helper method to check email in other collections
  private async checkEmailInOtherCollections(
    email: string,
    currentRole: string,
    currentUserId: string,
    session: mongoose.ClientSession,
  ): Promise<boolean> {
    const collections = {
      CLIENT: ClientModel,
      ARTISAN: ArtisanModel,
      ADMIN: AdminModel,
    };

    for (const [role, Model] of Object.entries(collections)) {
      if (role === currentRole) continue;

      const existing = await (Model as any)
        .findOne({
          email: email,
          _id: { $ne: currentUserId }, // Exclude current user if updating
        })
        .session(session);

      if (existing) {
        return true;
      }
    }

    return false;
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

  /*
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
    */
  async findByEmail(email: string): Promise<UserAggregate | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // First check the identity collection for faster lookup
    const identity = await UserIdentityModel.findOne({
      email: normalizedEmail,
    });

    if (!identity) {
      return null;
    }

    // Then fetch from the appropriate collection
    let userData: any;

    switch (identity.role) {
      case "CLIENT":
        userData = await ClientModel.findById(identity.userId).select(
          "+password",
        );
        break;
      case "ARTISAN":
        userData = await ArtisanModel.findById(identity.userId).select(
          "+password",
        );
        break;
      case "ADMIN":
        userData = await AdminModel.findById(identity.userId).select(
          "+password",
        );
        break;
    }

    if (!userData) {
      // Inconsistent state - identity exists but user doesn't
      // Clean up the orphaned identity record
      await UserIdentityModel.deleteOne({ email: normalizedEmail });
      return null;
    }

    return this.toDomain(userData);
  }

  async find(
    role?: string,
    page = 1,
    limit = 10,
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
        { new: true },
      ).exec();
    } catch (error: any) {
      throw new Error(
        `Failed to update rating for user ${userId}: ${error.message}`,
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
    // console.log(
    // // `Saving user ${user.id} - isEmailVerified: ${user.isEmailVerified}`,
    // );

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
      emailVerifiedAt: user.isEmailVerified
        ? user._user.emailVerifiedAt || new Date()
        : null,
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
        categories: user.categories?.toJSON() ?? [],
        certificates: user.getCertificates
          ? user.getCertificates().map((cert) => cert.toJSON())
          : [],
      };
    } else if (user.role === "ADMIN") {
      return {
        ...base,
        permissions: user.permissions,
      };
    }
  }

  private toDomain(data: any): UserAggregate {
    let user: UserAggregate;

    // CRITICAL: Extract email verification data first
    const isEmailVerified = data.isEmailVerified || false;
    const emailVerificationToken = data.emailVerificationToken || null;
    const emailVerifiedAt = data.emailVerifiedAt || null;

    //console.log(
    //  `Loading user ${data._id} - DB isEmailVerified: ${isEmailVerified}`
    //);

    if (data.role === "CLIENT") {
      console.log(
        "Database uploadedProducts:",
        data.uploadedProducts?.length || 0,
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
          data.deliveryAddress?.country || "",
        ),
        new ServicePreferences(
          Array.isArray(data.servicePreferences) ? data.servicePreferences : [],
        ),
        data.profilePicture,
        data.uploadedProducts || [],
        isEmailVerified,
        emailVerificationToken,
        emailVerifiedAt,
      );
    } else if (data.role === "ARTISAN") {
      const skills = Array.isArray(data.skillSet)
        ? data.skillSet
        : ["General Repair"];

      // NEW: Handle categories
      const categoriesData = data.categories || [];
      const categories =
        Array.isArray(categoriesData) && categoriesData.length > 0
          ? Categories.fromJSON(categoriesData)
          : new Categories(["GENERAL"]); // Default category if none exist
      const certificatesData = data.certificates || [];
      const certificates = Certificates.fromJSON(certificatesData);

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
        categories,
        certificates,
        data.profilePicture,
        isEmailVerified,
        emailVerificationToken,
        emailVerifiedAt,
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
        // data.isEmailVerified,
        // data.emailVerificationToken
        isEmailVerified,
        emailVerificationToken,
        emailVerifiedAt,
      );
    } else {
      throw new Error(`Unknown role ${data.role}`);
    }

    // CRITICAL: Restore email verification state from database AFTER creating the user
    // This ensures the database state is preserved regardless of updates
    //user.isEmailVerified = data.isEmailVerified || false;
    //
    //if (data.emailVerificationToken) {
    //  user.setEmailVerificationToken(data.emailVerificationToken);
    //}
    //
    //user.emailVerifiedAt = data.emailVerifiedAt;

    //console.log(
    //  `User ${user.id} loaded - isEmailVerified: $//{user.isEmailVerified}`,
    //);

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
        categories: user.getCategoryNames ? user.getCategoryNames() : [],
        certificates: (user as any).certificates
          ? (user as any).certificates.toJSON()
          : [],
        pendingCertificatesCount: (user as any).certificates
          ? (user as any).certificates.pendingCount
          : 0,
        approvedCertificatesCount: (user as any).certificates
          ? (user as any).certificates.approvedCount
          : 0,
      };
    } else if (user.role === "ADMIN") {
      return {
        ...base,
        permissions: user.permissions,
      };
    }
  }

  /**
   * Find artisans by a single category
   * @param category - Category name (e.g., "PHONES", "TABLETS")
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  async findArtisansByCategory(
    category: string,
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    const skip = (page - 1) * limit;
    const normalizedCategory = category.trim().toUpperCase();

    console.log(`Searching for artisans in category: ${normalizedCategory}`);

    // Query for artisans with the specified category
    const query = {
      role: "ARTISAN",
      "categories.name": normalizedCategory,
    };

    // Execute both queries in parallel for efficiency
    const [docs, total] = await Promise.all([
      ArtisanModel.find(query)
        .skip(skip)
        .limit(limit)
        .select("+password")
        .lean(),
      ArtisanModel.countDocuments(query),
    ]);

    console.log(`Found ${docs.length} artisans (total: ${total})`);

    // Convert to domain aggregates
    const artisans = docs.map((doc) =>
      this.toDomain({ ...doc, role: "ARTISAN" }),
    );

    return { artisans, total };
  }

  /**
   * Find artisans by multiple categories (OR logic)
   * @param categories - Array of category names
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  async findArtisansByCategories(
    categories: string[],
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    const skip = (page - 1) * limit;
    const normalizedCategories = categories.map((cat) =>
      cat.trim().toUpperCase(),
    );

    console.log(
      `Searching for artisans in categories: ${normalizedCategories.join(", ")}`,
    );

    // Query for artisans with ANY of the specified categories
    const query = {
      role: "ARTISAN",
      "categories.name": { $in: normalizedCategories },
    };

    const [docs, total] = await Promise.all([
      ArtisanModel.find(query)
        .skip(skip)
        .limit(limit)
        .select("+password")
        .lean(),
      ArtisanModel.countDocuments(query),
    ]);

    console.log(`Found ${docs.length} artisans (total: ${total})`);

    const artisans = docs.map((doc) =>
      this.toDomain({ ...doc, role: "ARTISAN" }),
    );

    return { artisans, total };
  }

  /**
   * Get all unique categories from all artisans
   * @returns Array of category names (sorted alphabetically)
   */
  async getAllCategories(): Promise<string[]> {
    console.log("Fetching all categories from database");

    // Use distinct to get unique category names
    const categoryNames = await ArtisanModel.distinct("categories.name").exec();

    // Ensure we return strings and sort them
    const categories: string[] = Array.isArray(categoryNames)
      ? categoryNames.map(String).filter(Boolean).sort()
      : [];

    console.log(`Found ${categories.length} unique categories`);

    return categories;
  }

  /**
   * Find artisans by category and location
   * @param category - Category name
   * @param location - Location string (partial match supported)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Object with artisans array and total count
   */
  async findArtisansByCategoryAndLocation(
    category: string,
    location: string,
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    const skip = (page - 1) * limit;
    const normalizedCategory = category.trim().toUpperCase();

    console.log(
      `Searching for artisans in category: ${normalizedCategory}, location: ${location}`,
    );

    // Use regex for flexible location matching (case-insensitive)
    const locationRegex = new RegExp(location.trim(), "i");

    const query = {
      role: "ARTISAN",
      "categories.name": normalizedCategory,
      location: locationRegex,
    };

    const [docs, total] = await Promise.all([
      ArtisanModel.find(query)
        .skip(skip)
        .limit(limit)
        .select("+password")
        .lean(),
      ArtisanModel.countDocuments(query),
    ]);

    console.log(`Found ${docs.length} artisans (total: ${total})`);

    const artisans = docs.map((doc) =>
      this.toDomain({ ...doc, role: "ARTISAN" }),
    );

    return { artisans, total };
  }

  /**
   * Find artisans by category with Redis caching
   * This is optional but recommended for performance
   */
  async findArtisansByCategoryWithCache(
    category: string,
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    await connectRedis();
    const cacheKey = `artisans:category:${category.toUpperCase()}:page:${page}:limit:${limit}`;

    try {
      if (!redis) {
        throw new Error("Not initialized");
      }
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`Cache HIT for category:${category}`);
        const data = JSON.parse(cached);
        return {
          artisans: data.artisans.map((a: any) => this.toDomain(a)),
          total: data.total,
        };
      }

      console.log(`Cache MISS for category:${category}`);

      // Get from database
      const result = await this.findArtisansByCategory(category, page, limit);

      // Cache the result for 5 minutes
      await redis.set(
        cacheKey,
        JSON.stringify({
          artisans: result.artisans.map((a) => this.toPersistence(a)),
          total: result.total,
        }),
        { EX: 60 * 5 }, // 5 minutes
      );

      return result;
    } catch (error) {
      console.error(`Error in category cache for ${category}:`, error);
      // Fallback to direct query if cache fails
      return this.findArtisansByCategory(category, page, limit);
    }
  }

  /**
   * Invalidate category cache
   * Call this when artisan categories are updated
   */
  async invalidateCategoryCache(category?: string): Promise<void> {
    await connectRedis();
    if (!redis) {
      throw new Error("Not initialized");
    }

    if (category) {
      // Invalidate specific category (would need to track all page keys)
      // For simplicity, we'll just log - in production use Redis SCAN
      console.log(`Invalidating cache for category: ${category}`);
      // You could delete the "all categories" cache here
      await redis.del("categories:all");
    } else {
      // Invalidate all categories cache
      await redis.del("categories:all");
      console.log("Invalidated all categories cache");
    }
  }

  // ========== CERTIFICATE REPOSITORY METHODS ==========

  /**
   * Add a certificate to an artisan's profile
   */
  async addCertificate(artisanId: string, certificate: any): Promise<void> {
    console.log(`Adding certificate for artisan ${artisanId}:`, certificate);

    // Get current user
    const user = await this.findById(artisanId);
    if (!user) {
      throw new BadRequestError("Artisan not found");
    }

    if (user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can have certificates");
    }

    // Create certificate from data
    const cert = Certificate.fromJSON(certificate);

    // Add certificate through the domain aggregate
    const updatedUser = user.addCertificate(cert);

    // Save to database
    await this.save(updatedUser);

    console.log(`Certificate added successfully for artisan ${artisanId}`);
  }

  /**
   * Remove a certificate from an artisan's profile
   */
  async removeCertificate(
    artisanId: string,
    certificateId: string,
  ): Promise<void> {
    console.log(
      `Removing certificate ${certificateId} for artisan ${artisanId}`,
    );

    const user = await this.findById(artisanId);
    if (!user) {
      throw new BadRequestError("Artisan not found");
    }

    if (user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can have certificates");
    }

    // Remove certificate through domain aggregate
    const updatedUser = user.removeCertificate(certificateId);

    // Save to database
    await this.save(updatedUser);

    console.log(`Certificate removed successfully`);
  }

  /**
   * Update certificate status (approve/reject)
   * Called by admins to review certificates
   */
  async updateCertificateStatus(
    artisanId: string,
    certificateId: string,
    status: "APPROVED" | "REJECTED",
    adminId: string,
    rejectionReason?: string,
  ): Promise<void> {
    console.log(
      `Updating certificate ${certificateId} status to ${status} for artisan ${artisanId}`,
    );

    const user = await this.findById(artisanId);
    if (!user) {
      throw new BadRequestError("Artisan not found");
    }

    if (user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can have certificates");
    }

    let updatedUser;

    if (status === "APPROVED") {
      // Approve the certificate
      updatedUser = user.approveCertificate(certificateId, adminId);
    } else {
      // Reject the certificate
      if (!rejectionReason) {
        throw new BadRequestError("Rejection reason is required");
      }
      updatedUser = user.rejectCertificate(
        certificateId,
        adminId,
        rejectionReason,
      );
    }

    // Save to database
    await this.save(updatedUser);

    console.log(`Certificate status updated successfully to ${status}`);
  }

  /**
   * Get all artisans with pending certificates (for admin review)
   */
  async getArtisansWithPendingCertificates(
    page = 1,
    limit = 10,
  ): Promise<{ artisans: UserAggregate[]; total: number }> {
    const skip = (page - 1) * limit;

    console.log(
      `Fetching artisans with pending certificates - page: ${page}, limit: ${limit}`,
    );

    // Query for artisans with at least one pending certificate
    const query = {
      role: "ARTISAN",
      "certificates.status": "PENDING",
    };

    const [docs, total] = await Promise.all([
      ArtisanModel.find(query)
        .skip(skip)
        .limit(limit)
        .select("+password")
        .lean(),
      ArtisanModel.countDocuments(query),
    ]);

    console.log(
      `Found ${docs.length} artisans with pending certificates (total: ${total})`,
    );

    const artisans = docs.map((doc) =>
      this.toDomain({ ...doc, role: "ARTISAN" }),
    );

    return { artisans, total };
  }

  /**
   * Get all pending certificates across all artisans
   * Returns artisan info with their pending certificates
   */
  async getAllPendingCertificates(): Promise<
    Array<{
      artisanId: string;
      artisanName: string;
      artisanEmail: string;
      certificates: any[];
    }>
  > {
    console.log("Fetching all pending certificates");

    const artisans = await ArtisanModel.find({
      role: "ARTISAN",
      "certificates.status": "PENDING",
    })
      .select("+password")
      .lean();

    console.log(`Found ${artisans.length} artisans with pending certificates`);

    return artisans.map((artisan: any) => ({
      artisanId: artisan._id.toString(),
      artisanName: artisan.fullName,
      artisanEmail: artisan.email,
      certificates: (artisan.certificates || []).filter(
        (cert: any) => cert.status === "PENDING",
      ),
    }));
  }
}
