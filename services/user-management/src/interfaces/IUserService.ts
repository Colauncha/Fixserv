import { UserAggregate } from "../domain/aggregates/userAggregate";

export interface IUserService {
  registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
    phoneNumber: string,
    clientData?: {
      deliveryAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      servicePreferences: string[];
    },
    artisanData?: {
      businessName: string;
      location: string;
      rating: number;
      skillSet: string[];
      businessHours: Record<string, { open: string; close: string }>;
    },
    adminData?: {
      permissions: string[];
    }
  ): Promise<{ user: UserAggregate }>;
}

export interface IAuthService {
  login(
    email: string,
    password: string
  ): Promise<{ user: UserAggregate; BearerToken: string }>;

  findUserById(id: string): Promise<UserAggregate>;
}
