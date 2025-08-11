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
    public uploadedProducts: any[] = [] // Optional field for uploaded products
  ) {
    super(id, email, password, fullName, "CLIENT", phoneNumber, profilePicture);
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
      this.uploadedProducts
    );
  }
}
