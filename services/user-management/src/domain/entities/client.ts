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
    //public isEmailVerified?: boolean,
    //public emailVerificationToken?: string | null,
    //public emailVerifiedAt?: Date | null
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null
  ) {
    // super(id, email, password, fullName, "CLIENT", phoneNumber, profilePicture);
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
      emailVerifiedAt
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
      this.emailVerifiedAt
    );
  }
}
