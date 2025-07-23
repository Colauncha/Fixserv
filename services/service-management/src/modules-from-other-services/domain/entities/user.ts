import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";

export abstract class User {
  constructor(
    public readonly id: string,
    public email: Email,
    public password: Password,
    public fullName: string,
    public role: "CLIENT" | "ARTISAN" | "ADMIN",
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
  async changePassword(oldPlainPassword: string, newPlainPassword: string) {
    const isMatch = this.password.compare(oldPlainPassword);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }
    this.password = await Password.create(newPlainPassword);
  }
}
