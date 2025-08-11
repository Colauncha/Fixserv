import { v4 as uuidv4 } from "uuid";
import { IBaseServiceRepository } from "../../domain/repository/baseServiceRepository";
import { BaseService } from "../../domain/entities/baseService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { OfferedService } from "../../domain/entities/offeredService";
import { IOfferedServiceRepository } from "../../domain/repository/offeredServiceRepository";
/**
 * AdminServiceManager handles the creation, listing, and deletion of base services.
 * It interacts with the IBaseServiceRepository to perform these operations.
 */
export class AdminServiceManager {
  constructor(
    private baseServiceRepository: IBaseServiceRepository,
    private offeredServiceRepository: IOfferedServiceRepository
  ) {}

  async createService(
    title: string,
    description: string,
    createdBy: string
  ): Promise<BaseService> {
    const baseService = new BaseService(
      uuidv4(),
      title,
      description,
      createdBy
    );
    await this.baseServiceRepository.createBaseService(baseService);
    return baseService;
  }

  async listAllServices(): Promise<BaseService[]> {
    return this.baseServiceRepository.getAll();
  }

  async getBaseServiceById(id: string): Promise<BaseService> {
    const baseService = await this.baseServiceRepository.findById(id);
    if (!baseService) {
      throw new BadRequestError("Base service with that id, not found");
    }
    return baseService;
  }

  async getOfferedServiceById(id: string): Promise<OfferedService> {
    const offeredService = await this.offeredServiceRepository.findById(id);
    if (!offeredService) {
      throw new BadRequestError("Offred service with that id, not found");
    }
    return offeredService;
  }

  async deleteService(id: string): Promise<void> {
    await this.baseServiceRepository.delete(id);
  }
}
