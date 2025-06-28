"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceService = void 0;
const service_1 = require("../../domain/entities/service");
const shared_1 = require("@fixserv-colauncha/shared");
const uuid_1 = require("uuid");
const serviceDetails_1 = require("../../domain/value-objects/serviceDetails");
const shared_2 = require("@fixserv-colauncha/shared");
const serviceCreatedEvent_1 = require("../../events/serviceCreatedEvent");
const redisUtils_1 = require("../../infrastructure/utils/redisUtils");
const serviceLoader_1 = require("../../infrastructure/loaders/serviceLoader");
const serviceRepositoryImpl_1 = require("../../infrastructure/serviceRepositoryImpl");
class ServiceService {
    constructor(serviceRepository, artisanRepository) {
        this.serviceRepository = serviceRepository;
        this.artisanRepository = artisanRepository;
        this.eventBus = new shared_2.RedisEventBus();
        this.serviceRepoImpl = new serviceRepositoryImpl_1.ServiceRepositoryImpl();
    }
    createService(artisanId, title, description, price, estimatedDuration, rating) {
        return __awaiter(this, void 0, void 0, function* () {
            const artisan = yield this.artisanRepository.findById(artisanId);
            if (!artisan || artisan.role !== "ARTISAN") {
                throw new shared_1.BadRequestError("Invalid artisan ID");
            }
            const service = new service_1.Service((0, uuid_1.v4)(), artisanId, new serviceDetails_1.ServiceDetails(title, description, price, estimatedDuration), true, rating);
            // Publish event
            const event = new serviceCreatedEvent_1.ServiceCreatedEvent({
                serviceId: service.id,
                // name: service,
                // createdAt: service.createdAt,
            });
            yield this.serviceRepository.save(service);
            yield this.eventBus.publish("service_events", event);
            //invalidate cache
            yield (0, redisUtils_1.clearServiceCache)();
            return service;
        });
    }
    isValidArtisan(artisan) {
        return artisan.role === "ARTISAN";
    }
    listArtisanServices(artisanId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.serviceRepository.findByArtisanId(artisanId);
        });
    }
    getServiceById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // const service = await this.serviceRepository.findById(id);
            const service = yield serviceLoader_1.serviceLoader.load(id);
            if (!service) {
                throw new shared_1.BadRequestError("Service not found");
            }
            return service;
        });
    }
    updateService(serviceId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(updates).length === 0) {
                throw new shared_1.BadRequestError("No update fields provided");
            }
            // Validate price if provided
            if (updates.price !== undefined && updates.price <= 0) {
                throw new shared_1.BadRequestError("Price must be a positive number");
            }
            // Get existing service to validate
            // const existingService = await this.serviceRepository.findById(serviceId);
            const existingService = yield serviceLoader_1.serviceLoader.load(serviceId);
            if (!existingService) {
                throw new shared_1.BadRequestError("Service not found");
            }
            // Apply updates
            yield this.serviceRepository.updateService(serviceId, updates);
            // Invalidate cache
            yield (0, redisUtils_1.clearServiceCache)();
            // Return updated service
            // return this.serviceRepository.findById(serviceId) as Promise<Service>;
            return serviceLoader_1.serviceLoader.load(serviceId);
        });
    }
    getServices() {
        return __awaiter(this, void 0, void 0, function* () {
            const services = yield this.serviceRepository.getServices();
            if (!services || services.length === 0) {
                throw new shared_1.BadRequestError("No services found");
            }
            return services;
        });
    }
    deleteService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // const service = await this.serviceRepository.findById(id);
            const service = yield serviceLoader_1.serviceLoader.load(id);
            if (!service) {
                throw new shared_1.BadRequestError("Service not found");
            }
            // Invalidate cache before deletion
            yield (0, redisUtils_1.clearServiceCache)();
            yield this.serviceRepository.deleteService(id);
        });
    }
    getPaginatedServices(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.serviceRepository.getPaginatedServices(page, limit);
        });
    }
    streamServices() {
        return __awaiter(this, void 0, void 0, function* () {
            const cursor = yield this.serviceRepoImpl.streamAllServices();
            // Return the cursor directly as a readable stream
            return cursor;
        });
    }
}
exports.ServiceService = ServiceService;
