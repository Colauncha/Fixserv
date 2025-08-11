import { UserAggregate } from "../aggregates/userAggregate";

export interface IUserRepository {
  // save(user: UserAggregate): Promise<void>;
  save(user: UserAggregate): Promise<UserAggregate>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  find(
    role?: string,
    page?: number,
    limit?: number
  ): Promise<{
    users: UserAggregate[];
    total: number;
  }>;
}
