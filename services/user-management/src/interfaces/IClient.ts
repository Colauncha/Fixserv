import { IUser } from "./IUser";

export interface IClient extends IUser {
  deliveryAddress: {
    street: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  };
  servicePreferences: string[];
}
