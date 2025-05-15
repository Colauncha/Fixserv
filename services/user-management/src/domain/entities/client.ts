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
    public deliveryAddress: DeliveryAddress,
    public servicePreferences: ServicePreferences
  ) {
    super(id, email, password, fullName, "CLIENT");
  }

  updatePreferences(newPreferences: string[]): Client {
    return new Client(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.deliveryAddress,
      new ServicePreferences(newPreferences)
    );
  }
}
