import { SkillSet } from "../../modules-from-other-services/domain/value-objects/skillSet";
import { ServiceDetails } from "../value-objects/serviceDetails";

export class Service {
  constructor(
    public readonly id: string,
    public readonly artisanId: string,
    public readonly details: ServiceDetails,
    public isActive: boolean,
    public rating: number,
    public skillSet: SkillSet
  ) {}
}
