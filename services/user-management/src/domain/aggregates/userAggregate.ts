import { Admin } from "../entities/admin";
import { Artisan } from "../entities/artisan";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { Client } from "../entities/client";
import { User } from "../entities/user";
import { BusinessHours } from "../value-objects/businessHours";
import { DeliveryAddress } from "../value-objects/deliveryAddress";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { ServicePreferences } from "../value-objects/servicePreferences";
import { SkillSet } from "../value-objects/skillSet";

export class UserAggregate {
  private constructor(private readonly _user: User) {}

  static createClient(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    address: DeliveryAddress,
    preferences: ServicePreferences,
    profilePicture?: string | null,
    uploadedProducts?: any[]
  ): UserAggregate {
    const client = new Client(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      address,
      preferences,
      profilePicture || undefined,
      uploadedProducts || []
    );
    return new UserAggregate(client);
  }

  static createArtisan(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    businessName: string,
    location: string,
    rating: number,
    skillSet: SkillSet,
    businessHours: BusinessHours,
    profilePicture?: string | null
  ): UserAggregate {
    const artisan = new Artisan(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      businessName,
      location,
      rating,
      skillSet,
      businessHours,
      profilePicture || undefined
    );
    return new UserAggregate(artisan);
  }

  static createAdmin(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    permissions: string[],
    profilePicture?: string | null
  ) {
    const admin = new Admin(
      id,
      email,
      password,
      fullName,
      phoneNumber,
      permissions,
      profilePicture || undefined
    );
    return new UserAggregate(admin);
  }

  async changePassword(
    oldPlainPassword: string,
    newPlainPassword: string
  ): Promise<void> {
    if (!(await this._user.password.compare(oldPlainPassword))) {
      throw new BadRequestError("Old passowrd is incorrect");
    }
    this._user.password = await Password.create(newPlainPassword);
  }

  async setPassword(newPlainPassword: string): Promise<void> {
    this._user.password = await Password.create(newPlainPassword);
  }

  get id(): string {
    return this._user.id;
  }

  get email(): string {
    return this._user.email.value;
  }

  get password(): string {
    return this._user.password.hash;
  }
  get role(): "CLIENT" | "ARTISAN" | "ADMIN" {
    return this._user.role;
  }

  get fullName(): string {
    return this._user.fullName;
  }

  get deliveryAddress(): DeliveryAddress {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients have delivery addresses");
    }
    return (this._user as Client).deliveryAddress;
  }

  get servicePreferences(): ServicePreferences {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError(
        "Service Preferences are only availabe for clients"
      );
    }
    return (this._user as Client).servicePreferences;
  }

  get businessName(): string {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Business name are only availabe for artisans");
    }
    return (this._user as Artisan).businessName;
  }

  get skills(): SkillSet {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Skills name are only availabe for artisans");
    }
    return (this._user as Artisan).skillSet;
  }

  get permissions(): string[] {
    if (this._user.role !== "ADMIN") {
      throw new BadRequestError("Permissions  are only availabe or admins");
    }
    return (this._user as Admin).permissions;
  }

  get businessHours(): BusinessHours {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Permissions  are only availabe or admins");
    }
    return (this._user as Artisan).businessHours;
  }

  get location(): string {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Location are only availabe for artisans");
    }
    return (this._user as Artisan).location;
  }
  get rating(): number {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Rating are only availabe for artisans");
    }
    return (this._user as Artisan).rating;
  }
  get profilePicture(): string | undefined {
    return this._user.profilePicture;
  }
  get uploadedProducts(): any[] {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError(
        "Uploaded products are only available for clients"
      );
    }
    return (this._user as Client).uploadedProducts || [];
  }

  get phoneNumber(): string {
    return this._user.phoneNumber;
  }

  setUploadedProducts(products: any[]): void {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients can have uploaded products");
    }
    (this._user as Client).uploadedProducts = products || [];
  }

  updateFullName(fullName: string) {
    if (!fullName || fullName.trim().length === 0) {
      throw new BadRequestError("Full name cannot be empty");
    }
    this._user.fullName = fullName;
  }

  updateRating(newRating: number) {
    if (!newRating || typeof newRating !== "number") {
      throw new BadRequestError("Rating cannot be empty and must be a number");
    }
    return ((this._user as Artisan).rating = newRating);
  }

  updateDeliveryAddress(newAddress: DeliveryAddress): void {
    if (this._user.role !== "CLIENT") {
      throw new BadRequestError("Only clients have delivery addresses");
    }
    (this._user as Client).deliveryAddress = newAddress;
  }

  updateServicePreferences(preferences: ServicePreferences) {
    if (this._user.role !== "CLIENT") {
      throw new Error("Only clients can have service preferences");
    }
    (this._user as Client).servicePreferences = preferences;
  }

  updateBusinessName(name: string) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can have business names");
    }
    (this._user as Artisan).businessName = name;
  }

  updateLocation(location: string) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can update location");
    }
    (this._user as Artisan).location = location;
  }

  updateSkillSet(newSKill: SkillSet): void {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can  add skills");
    }
    (this._user as Artisan).skillSet = newSKill;
  }
  updateBusinessHours(hours: BusinessHours) {
    if (this._user.role !== "ARTISAN") {
      throw new BadRequestError("Only artisans can update business hours");
    }

    (this._user as Artisan).businessHours = hours;
  }

  updatePermissions(permissions: string[]) {
    if (this._user.role !== "ADMIN") {
      throw new BadRequestError("Only admins can update permissions");
    }
    (this._user as Admin).permissions = permissions;
  }

  updateProfilePicture(imageUrl: string): void {
    this._user.profilePicture = imageUrl || undefined;
  }

  updatePhoneNumber(phoneNumber: string): void {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new BadRequestError("Phone number cannot be empty");
    }
    this._user.phoneNumber = phoneNumber;
  }

  /*
  static fromJSON(json: any): UserAggregate {
    const { id, fullName, role } = json;

    const email = Email.fromJSON(json.email || "");

    const password = Password.fromJSON(json.password || "");

    switch (role) {
      case "CLIENT": {
        const address = DeliveryAddress.fromJSON(json.deliveryAddress || {});

        const servicePreferences = ServicePreferences.fromJSON(
          json.servicePreferences || []
        );
        const client = UserAggregate.createClient(
          id,
          email,
          password,
          fullName,
          address,
          servicePreferences
        );
        // Optional fields
        if (json.profilePicture)
          client.updateProfilePicture(json.profilePicture);
        if (json.uploadedProducts)
          client.setUploadedProducts(json.uploadedProducts);

        return client;
      }
      case "ARTISAN": {
        const skillSet = new SkillSet(json.skills || []);
        const businessHours = BusinessHours.fromJSON(json.businessHours || {});
        const artisan = UserAggregate.createArtisan(
          id,
          email,
          password,
          fullName,
          json.businessName,
          json.location,
          json.rating,
          skillSet,
          businessHours
        );
        if (json.profilePicture)
          artisan.updateProfilePicture(json.profilePicture);

        return artisan;
      }
      case "ADMIN": {
        const admin = UserAggregate.createAdmin(
          id,
          email,
          password,
          fullName,
          json.permissions || []
        );
        if (json.profilePicture)
          admin.updateProfilePicture(json.profilePicture);

        return admin;
      }
      default:
        throw new BadRequestError(`Unknown role: ${role}`);
    }
  }

  toJSON(): any {
    const base = {
      id: this.id,
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      role: this.role,
      profilePicture: this.profilePicture,
      createdAt: this._user.createdAt,
      updatedAt: this._user.updatedAt,
    };

    switch (this.role) {
      case "CLIENT":
        return {
          ...base,
          deliveryAddress: this.deliveryAddress,
          servicePreferences: this.servicePreferences,
          uploadedProducts: this.uploadedProducts,
        };
      case "ARTISAN":
        return {
          ...base,
          businessName: this.businessName,
          location: this.location,
          rating: this.rating,
          skills: this.skills,
          businessHours: this.businessHours,
        };
      case "ADMIN":
        return {
          ...base,
          permissions: this.permissions,
        };
      default:
        return base;
    }
  }
    */
  /*
  static fromJSON(json: any): UserAggregate {
    const { id, fullName, role } = json;
    const email = Email.fromJSON(json.email || "");
    const password = Password.fromJSON(json.password || "");
    const profilePicture = json.profilePicture;

    switch (role) {
      case "CLIENT":
        const address = DeliveryAddress.fromJSON(json.deliveryAddress || {});
        const servicePreferences = ServicePreferences.fromJSON(
          json.servicePreferences || []
        );
        const uploadedProducts = json.uploadedProducts || [];

        const client = UserAggregate.createClient(
          id,
          email,
          password,
          fullName,
          address,
          servicePreferences
        );
        client.updateProfilePicture(profilePicture);
        client.setUploadedProducts(uploadedProducts);
        return client;

      case "ARTISAN":
        const skillSet = new SkillSet(json.skills || []);
        const businessHours = BusinessHours.fromJSON(json.businessHours || {});
        const artisan = UserAggregate.createArtisan(
          id,
          email,
          password,
          fullName,
          json.businessName,
          json.location,
          json.rating,
          skillSet,
          businessHours
        );
        artisan.updateProfilePicture(profilePicture);
        return artisan;

      case "ADMIN":
        const admin = UserAggregate.createAdmin(
          id,
          email,
          password,
          fullName,
          json.permissions || []
        );
        admin.updateProfilePicture(profilePicture);
        return admin;

      default:
        throw new BadRequestError(`Unknown role: ${role}`);
    }
  }
  isClient(): boolean {
    return this._user.role === "CLIENT";
  }

  isArtisan(): boolean {
    return this._user.role === "ARTISAN";
  }

  isAdmin(): boolean {
    return this._user.role === "ADMIN";
  }
    */
  static fromJSON(json: any): UserAggregate {
    const { id, fullName, role } = json;
    const email = Email.fromJSON(json.email || "");
    const password = Password.fromJSON(json.password || "");
    const profilePicture = json.profilePicture || null;
    const phoneNumber = json.phoneNumber || "";

    switch (role) {
      case "CLIENT":
        const address = DeliveryAddress.fromJSON(json.deliveryAddress || {});
        const servicePreferences = ServicePreferences.fromJSON(
          json.servicePreferences || []
        );
        const uploadedProducts = json.uploadedProducts || [];
        return UserAggregate.createClient(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          address,
          servicePreferences,
          profilePicture,
          uploadedProducts
        );

      case "ARTISAN":
        const skillSetData = json.skillSet || json.skills || [];
        let skillSet: SkillSet;
        if (Array.isArray(skillSetData) && skillSetData.length > 0) {
          skillSet = new SkillSet(skillSetData);
        } else {
          skillSet = new SkillSet(["General Service"]);
        }
        const businessHours = BusinessHours.fromJSON(json.businessHours || {});
        return UserAggregate.createArtisan(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          json.businessName,
          json.location,
          json.rating,
          skillSet,
          businessHours,
          profilePicture
        );

      case "ADMIN":
        return UserAggregate.createAdmin(
          id,
          email,
          password,
          fullName,
          phoneNumber,
          json.permissions || [],
          profilePicture
        );

      default:
        throw new BadRequestError(`Unknown role: ${role}`);
    }
  }

  isClient(): boolean {
    return this._user.role === "CLIENT";
  }

  isArtisan(): boolean {
    return this._user.role === "ARTISAN";
  }

  isAdmin(): boolean {
    return this._user.role === "ADMIN";
  }

  toJSON(): any {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      role: this.role,
      phoneNumber: this.phoneNumber,
      profilePicture: this.profilePicture,
      createdAt: this._user.createdAt,
      updatedAt: this._user.updatedAt,
      ...(this.isClient() && {
        deliveryAddress: this.deliveryAddress.toJSON(),
        servicePreferences: this.servicePreferences.toJSON(),
        uploadedProducts: this.uploadedProducts,
      }),
      ...(this.isArtisan() && {
        businessName: this.businessName,
        location: this.location,
        rating: this.rating,
        skillSet: this.skills,
        businessHours: this.businessHours,
      }),
      ...(this.isAdmin() && {
        permissions: this.permissions,
      }),
    };
  }
}
