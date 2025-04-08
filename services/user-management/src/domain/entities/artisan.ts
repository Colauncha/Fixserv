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
    public readonly businessName: string,
    public readonly location: string,
    public readonly rating: number,
    public skillSet: SkillSet,
    public readonly businessHours: BusinessHours
  ) {
    super(id, email, fullName, password, "ARTISAN");
  }
  addSkill(newSkill: string): Artisan {
    return new Artisan(
      this.id,
      this.email,
      this.password,
      this.fullName,
      this.businessName,
      this.location,
      this.rating,
      this.skillSet.addSkill(newSkill),
      this.businessHours
    );
  }
}
