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
    address: DeliveryAddress,
    preferences: ServicePreferences
  ): UserAggregate {
    const client = new Client(
      id,
      email,
      password,
      fullName,
      address,
      preferences
    );
    return new UserAggregate(client);
  }

  static createArtisan(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    businessName: string,
    location: string,
    rating: number,
    skillSet: SkillSet,
    businessHours: BusinessHours
  ): UserAggregate {
    const artisan = new Artisan(
      id,
      email,
      password,
      fullName,
      businessName,
      location,
      rating,
      skillSet,
      businessHours
    );
    return new UserAggregate(artisan);
  }

  static createAdmin(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    permissions: string[]
  ) {
    const admin = new Admin(id, email, password, fullName, permissions);
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
}
