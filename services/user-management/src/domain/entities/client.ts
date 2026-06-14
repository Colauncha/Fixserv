import { DeliveryAddress } from "../value-objects/deliveryAddress";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { ServicePreferences } from "../value-objects/servicePreferences";
import { User } from "./user";

export class Client extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    public deliveryAddress: DeliveryAddress,
    public servicePreferences: ServicePreferences,
    public profilePicture?: string, // Optional field for profile picture URL
    public uploadedProducts: any[] = [], // Optional field for uploaded products
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
    lastActiveAt?: Date | null,
    public hasCompletedProfile?: boolean,
    isSuspended: boolean = false,
    suspendedUntil?: Date | null,
    suspensionReason?: string | null,
    suspendedBy?: string | null,
    suspendedAt?: Date | null,
  ) {
    super(
      id,
      email,
      password,
      fullName,
      "CLIENT",
      phoneNumber,
      profilePicture,
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt,
      lastActiveAt,
      hasCompletedProfile,
      isSuspended,
      suspendedUntil,
      suspensionReason,
      suspendedBy,
      suspendedAt,
    );
  }

  updatePreferences(newPreferences: string[]): Client {
    return new Client(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.deliveryAddress,
      new ServicePreferences(newPreferences),
      this.profilePicture,
      this.uploadedProducts,
      //critical:preserve email verification state when creating new instances
      this.isEmailVerified,
      this.emailVerificationToken,
      this.emailVerifiedAt,
      this.lastActiveAt,
      this.hasCompletedProfile,
      this.isSuspended,
      this.suspendedUntil,
      this.suspensionReason,
      this.suspendedBy,
      this.suspendedAt,
    );
  }
}
