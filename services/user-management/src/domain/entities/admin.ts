import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { User } from "./user";

export class Admin extends User {
  constructor(
    id: string,
    email: Email,
    fullName: string,
    password: Password,
    public permissions: string[]
  ) {
    super(id, email, fullName, password, "ADMIN");
  }
}
