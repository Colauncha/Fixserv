import { IUser } from "./IUser";

export interface IAdmin extends IUser {
  permissions: string[];
}
