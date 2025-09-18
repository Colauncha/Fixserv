import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { User } from "./user";

export class Admin extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber: string,
    public permissions: string[],
    public profilePicture?: string, // Optional field for profile picture URL
    // public isEmailVerified?: boolean,
    // public emailVerificationToken?: string | null,
    // public emailVerifiedAt?: Date | null
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null
  ) {
    super(
      id,
      email,
      password,
      fullName,
      "ADMIN",
      phoneNumber,
      profilePicture,
      isEmailVerified,
      emailVerificationToken,
      emailVerifiedAt
    );
  }
}
