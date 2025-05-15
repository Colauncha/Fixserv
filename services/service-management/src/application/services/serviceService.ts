import { Artisan } from "../../modules-from-user-management/domain/entities/artisan";
import { Service } from "../../domain/entities/service";
import { IArtisanRepository } from "../../domain/repository/artisanRepository";
import { IServiceRepository } from "../../domain/repository/serviceRepository";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { v4 as uuidv4 } from "uuid";
import { ServiceDetails } from "../../domain/value-objects/serviceDetails";

import { RedisEventBus } from "@fixserv-colauncha/shared";
import { ServiceCreatedEvent } from "../../events/serviceCreatedEvent";

export class ServiceService {
  private eventBus = new RedisEventBus();
  constructor(
    private serviceRepository: IServiceRepository,
    private artisanRepository: IArtisanRepository
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

    const service = new Service(
      uuidv4(),
      artisanId,
      new ServiceDetails(title, description, price, estimatedDuration),
      true,
      rating
    );

    // Publish event
    const event = new ServiceCreatedEvent({
      serviceId: service.id,
      // name: service,
      // createdAt: service.createdAt,
    });

    await this.serviceRepository.save(service);
    await this.eventBus.publish("service_events", event);
    return service;
  }
  private isValidArtisan(artisan: Artisan): boolean {
    return artisan.role === "ARTISAN";
  }
  async listArtisanServices(artisanId: string): Promise<Service[]> {
    return this.serviceRepository.findByArtisanId(artisanId);
  }

  async getServiceById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findById(id);
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
      rating?: number;
    }
  ): Promise<Service> {
    if (Object.keys(updates).length === 0) {
      throw new BadRequestError("No update fields provided");
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price <= 0) {
      throw new BadRequestError("Price must be a positive number");
    }

    // Get existing service to validate
    const existingService = await this.serviceRepository.findById(serviceId);
    if (!existingService) {
      throw new BadRequestError("Service not found");
    }

    // Apply updates
    await this.serviceRepository.updateService(serviceId, updates);

    // Return updated service
    return this.serviceRepository.findById(serviceId) as Promise<Service>;
  }
}
