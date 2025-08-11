import { v4 as uuidv4 } from "uuid";
import { IOfferedServiceRepository } from "../../domain/repository/offeredServiceRepository";
import { IBaseServiceRepository } from "../../domain/repository/baseServiceRepository";
import { OfferedService } from "../../domain/entities/offeredService";
import { NotFoundError, BadRequestError } from "@fixserv-colauncha/shared";

export class ArtisanServiceManager {
  constructor(
    private offeredServiceRepo: IOfferedServiceRepository,
    private baseServiceRepo: IBaseServiceRepository
  ) {}

  async offerService(
    artisanId: string,
    baseServiceId: string,
    price: number,
    estimatedDuration: string,
    skillSet?: string[]
  ): Promise<OfferedService> {
    // 1. Ensure base service exists
    const baseService = await this.baseServiceRepo.findById(baseServiceId);
    if (!baseService) {
      throw new BadRequestError("Base service not found");
    }

    // 2. Prevent duplicate offering
    const existing = await this.offeredServiceRepo.findByArtisanAndBaseService(
      artisanId,
      baseServiceId
    );
    if (existing) {
      throw new BadRequestError("You already offer this service");
    }

    // 3. Create and save
    const offeredService = new OfferedService(
      uuidv4(),
      artisanId,
      baseServiceId,
      price,
      estimatedDuration,
      undefined, // rating starts undefined
      skillSet
    );

    await this.offeredServiceRepo.create(offeredService);
    return offeredService;
  }
}
