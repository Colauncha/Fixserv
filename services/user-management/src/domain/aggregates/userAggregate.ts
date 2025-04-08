import { BadRequestError } from "../../errors/badRequestError";
import { Admin } from "../entities/admin";
import { Artisan } from "../entities/artisan";
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
    rating: number,
    location: string,
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
    console.log(artisan);
    return new UserAggregate(artisan);
  }

  static createAdmin(
    id: string,
    email: Email,
    fullName: string,
    password: Password,
    permissions: string[]
  ) {
    const admin = new Admin(id, email, fullName, password, permissions);
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
      throw new Error("Only clients have delivery addresses");
    }
    return (this._user as Client).deliveryAddress;
  }

  get servicePreferences(): ServicePreferences {
    if (this._user.role !== "CLIENT") {
      throw new Error("Service Preferences are only availabe for clients");
    }
    return (this._user as Client).servicePreferences;
  }

  get businessName(): string {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Business name are only availabe for artisans");
    }
    return (this._user as Artisan).businessName;
  }

  get skills(): SkillSet {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Skills name are only availabe for artisans");
    }
    return (this._user as Artisan).skillSet;
  }

  get permissions(): string[] {
    if (this._user.role !== "ADMIN") {
      throw new Error("Permissions  are only availabe or admins");
    }
    return (this._user as Admin).permissions;
  }

  get businessHours(): BusinessHours {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Permissions  are only availabe or admins");
    }
    return (this._user as Artisan).businessHours;
  }

  get location(): string {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Location are only availabe for artisans");
    }
    return (this._user as Artisan).location;
  }
  get rating(): number {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Rating are only availabe for artisans");
    }
    return (this._user as Artisan).rating;
  }

  updateAddress(newAddress: DeliveryAddress): void {
    if (this._user.role !== "CLIENT") {
      throw new Error("Only clients have delivery addresses");
    }
    (this._user as Client).deliveryAddress = newAddress;
  }

  addSkill(newSKill: string): void {
    if (this._user.role !== "ARTISAN") {
      throw new Error("Only artisans can  add skills");
    }
    (this._user as Artisan).skillSet = (
      this._user as Artisan
    ).skillSet.addSkill(newSKill);
  }
}
