import { BusinessHours } from "../value-objects/businessHours";
import { Email } from "../value-objects/email";
import { Password } from "../value-objects/password";
import { SkillSet } from "../value-objects/skillSet";
import { User } from "./user";

class Artisan extends User {
  constructor(
    id: string,
    email: Email,
    password: Password,
    fullName: string,
    public readonly businessName: string,
    public readonly rating: number,
    public readonly location: string,
    public skillSet: SkillSet,
    public readonly businessHours: BusinessHours
  ) {
    super(id, email, password, fullName, "ARTISAN");
  }
  addSkill(newSkill: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.businessName,
      this.rating,
      this.location,
      this.skillSet.addSkill(newSkill),
      this.businessHours
    );
  }
  canProvideService(serviceType: string): boolean {
    return this.skillSet.hasSkill(serviceType);
  }
}

export { Artisan };
