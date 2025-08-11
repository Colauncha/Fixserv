import { Artisan } from "../../modules-from-other-services/domain/entities/artisan";
import { Service } from "../../domain/entities/service";
import { IArtisanRepository } from "../../domain/repository/artisanRepository";
import { IServiceRepository } from "../../domain/repository/serviceRepository";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { v4 as uuidv4 } from "uuid";
import { ServiceDetails } from "../../domain/value-objects/serviceDetails";

import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceCreatedEvent } from "../../events/serviceCreatedEvent";
import { clearServiceCache } from "../../infrastructure/utils/redisUtils";
import { serviceLoader } from "../../infrastructure/loaders/serviceLoader";
import { ServiceRepositoryImpl } from "../../infrastructure/serviceRepositoryImpl";
import { SkillSet } from "../../modules-from-other-services/domain/value-objects/skillSet";
import { IOfferedServiceRepository } from "../../domain/repository/offeredServiceRepository";
import { OfferedService } from "../../domain/entities/offeredService";

export class ServiceService {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);

  private serviceRepoImpl = new ServiceRepositoryImpl();
  constructor(
    private serviceRepository: IServiceRepository,
    private artisanRepository: IArtisanRepository,
    private offeredServiceRepository: IOfferedServiceRepository
  ) {}

  async createService(
    artisanId: string,
    title: string,
    description: string,
    price: number,
    estimatedDuration: string,
    rating: number
  ): Promise<Service> {
    const artisan = await this.artisanRepository.findById(artisanId);
    if (!artisan || artisan.role !== "ARTISAN") {
      throw new BadRequestError("Invalid artisan ID");
    }
    // Fetch artisan's skillSet
    const artisanSkillSet = await this.artisanRepository.getArtisanSkillSet(
      artisanId
    );
    if (!artisanSkillSet) {
      throw new BadRequestError("Artisan skillSet not found");
    }

    const service = new Service(
      uuidv4(),
      artisanId,
      new ServiceDetails(title, description, price, estimatedDuration),
      true,
      rating,
      artisanSkillSet
    );

    // // Publish event
    const event = new ServiceCreatedEvent({
      serviceId: service.id,
      title: service.details.title,
      artisanId: service.artisanId,
      serviceName: service.details.title,
    });

    await this.serviceRepository.save(service);
    await this.eventBus.publish("service_events", event);

    //invalidate cache
    await clearServiceCache();
    return service;
  }
  private isValidArtisan(artisan: Artisan): boolean {
    return artisan.role === "ARTISAN";
  }
  async listArtisanServices(artisanId: string): Promise<Service[]> {
    return this.serviceRepository.findByArtisanId(artisanId);
  }

  async getServiceById(id: string): Promise<Service> {
    // const service = await this.serviceRepository.findById(id);
    const service = await serviceLoader.load(id);
    if (!service) {
      throw new BadRequestError("Service not found");
    }
    return service;
  }
  async updateService(
    serviceId: string,
    updates: {
      title?: string;
      description?: string;
      price?: number;
      estimatedDuration?: string;
      isActive?: boolean;
    },
    callerArtisanId: string
  ): Promise<Service> {
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError("No update fields provided");
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price <= 0) {
      throw new BadRequestError("Price must be a positive number");
    }

    // Get existing service to validate
    // const existingService = await this.serviceRepository.findById(serviceId);
    const existingService = await serviceLoader.load(serviceId);
    if (!existingService) {
      throw new BadRequestError("Service not found");
    }

    if (existingService.artisanId !== callerArtisanId) {
      throw new BadRequestError(
        "Login as the artisan associated with this service"
      );
    }

    // Apply updates
    await this.serviceRepository.updateService(serviceId, updates);

    //clear in-memory Dataloader cache
    //serviceLoader.clear(serviceId);

    // Invalidate external rediscache
    await clearServiceCache();

    //RE-fetch fresh service from DB
    return serviceLoader.load(serviceId) as Promise<Service>;
  }

  async getServices(): Promise<Service[]> {
    const services = await this.serviceRepository.getServices();
    if (!services || services.length === 0) {
      throw new BadRequestError("No services found");
    }
    return services;
  }

  async deleteService(id: string, callerArtisanId: string): Promise<void> {
    // const service = await this.serviceRepository.findById(id);
    const service = await serviceLoader.load(id);
    if (!service) {
      throw new BadRequestError("Service not found");
    }

    if (service.artisanId !== callerArtisanId) {
      throw new BadRequestError(
        "Only the artisan associated with this service,can delete it"
      );
    }
    // Invalidate cache before deletion
    await clearServiceCache();
    await this.serviceRepository.deleteService(id);
  }

  async getPaginatedServices(page: number, limit: number): Promise<Service[]> {
    return this.serviceRepository.getPaginatedServices(page, limit);
  }

  async streamServices(): Promise<import("mongoose").Cursor<any>> {
    const cursor = await this.serviceRepoImpl.streamAllServices();
    // Return the cursor directly as a readable stream
    return cursor;
  }

  async offerBaseService(
    artisanId: string,
    baseServiceId: string,
    price: number,
    estimatedDuration: string,
    skillSet?: string[]
  ): Promise<OfferedService> {
    // validate artisan and base service existence (optional)
    const offeredService = new OfferedService(
      uuidv4(),
      artisanId,
      baseServiceId,
      price,
      estimatedDuration,
      0,
      skillSet,
      true
    );

    await this.offeredServiceRepository.create(offeredService);
    return offeredService;
  }
}
