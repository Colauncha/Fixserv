import { UserAggregate } from "../aggregates/userAggregate";

export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
}
