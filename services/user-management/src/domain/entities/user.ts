import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";

export abstract class User {
  public isEmailVerified: boolean = false;
  public emailVerificationToken?: string | null;
  public emailVerifiedAt?: Date | null;
  constructor(
    public readonly id: string,
    public email: Email,
    public password: Password,
    public fullName: string,
    public role: "CLIENT" | "ARTISAN" | "ADMIN",
    public phoneNumber: string,
    public profilePicture?: string, // Optional field for profile picture URL
    isEmailVerified?: boolean,
    emailVerificationToken?: string | null,
    emailVerifiedAt?: Date | null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    this.isEmailVerified = isEmailVerified || false;
    this.emailVerificationToken = emailVerificationToken;
    this.emailVerifiedAt = emailVerifiedAt;
  }

  async changePassword(oldPlainPassword: string, newPlainPassword: string) {
    const isMatch = this.password.compare(oldPlainPassword);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }
    this.password = await Password.create(newPlainPassword);
  }

  markEmailAsVerified(): void {
    this.isEmailVerified = true;
    this.emailVerificationToken = null;
    this.emailVerifiedAt = new Date();
    this.updatedAt = new Date();
  }
}
