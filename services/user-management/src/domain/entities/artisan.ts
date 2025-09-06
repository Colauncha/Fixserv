import { BusinessHours } from "../value-objects/businessHours";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { SkillSet } from "../value-objects/skillSet";
import { User } from "./user";

export class Artisan extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    phoneNumber:string,
    public businessName: string,
    public location: string,
    public rating: number,
    public skillSet: SkillSet,
    public businessHours: BusinessHours,
    public profilePicture?: string ,// Optional field for profile picture URL
    public isEmailVerified?: boolean,
public   emailVerificationToken?: string | null,
public   emailVerifiedAt?: Date | null,
  ) {
    super(id, email, password, fullName, "ARTISAN",phoneNumber, profilePicture);
  }
  addSkill(newSkill: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.phoneNumber,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet.addSkill(newSkill),
      this.businessHours
    );
  }
  canProvideService(serviceType: string): boolean {
    return this.skillSet.hasSkill(serviceType);
  }
}
