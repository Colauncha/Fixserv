import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { User } from "./user";

export class Admin extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    public permissions: string[]
  ) {
    super(id, email, password, fullName, "ADMIN");
  }
}
