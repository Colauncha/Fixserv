import { Service } from "../../domain/entities/service";
import { SkillSet } from "../../modules-from-other-services/domain/value-objects/skillSet";
import { ServiceDetails } from "../value-objects/serviceDetails";
import { v4 as uuidv4 } from "uuid";

export class ServiceAggregate {
  private constructor(private readonly _service: Service) {}

  static create(
    artisanId: string,
    title: string,
    description: string,
    price: number,
    estimatedDuration: string,
    rating: number,
    skillSet:SkillSet
  ): ServiceAggregate {
    const service = new Service(
      uuidv4(),
      artisanId,
      new ServiceDetails(title, description, price, estimatedDuration),
      true,
      rating,
      skillSet
    );
    return new ServiceAggregate(service);
  }

  get id(): string {
    return this._service.id;
  }

  get artisanId(): string {
    return this._service.artisanId;
  }

  get details(): ServiceDetails {
    return this._service.details;
  }

  get isActive(): boolean {
    return this._service.isActive;
  }

  get rating(): number {
    return this._service.rating;
  }
  get skillSet(): SkillSet {
    return this._service.skillSet;
  }

  deactivate(): void {
    this._service.isActive = false;
  }

  activate(): void {
    this._service.isActive = true;
  }
}
