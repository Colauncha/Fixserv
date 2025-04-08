import { UserAggregate } from "../domain/aggregates/userAggregate";

export interface IUserService {
  registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
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
      skillSet: string[];
      businessHours: Record<string, { open: string; close: string }>;
      location: string;
      rating: number;
    },
    adminData?: {
      permissions: string[];
    }
  ): Promise<{ user: UserAggregate; sessionToken: string }>;
}

export interface IAuthService {
  login(
    email: string,
    password: string
  ): Promise<{ user: UserAggregate; sessionToken: string }>;
  logout(sessionToken: string): Promise<void>;
  currentUser(): Promise<void>;
}
