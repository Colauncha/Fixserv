import { IUser } from "./IUser";

export interface IArtisan extends IUser {
  businessName: string;
  location: string;
  rating?: number;
  skillSet: string[];

  businessHours: Record<string, { open: string; close: string }>;
}
