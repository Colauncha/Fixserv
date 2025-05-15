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
class ServiceService {
    constructor(serviceRepository, artisanRepository) {
        this.serviceRepository = serviceRepository;
        this.artisanRepository = artisanRepository;
        this.eventBus = new shared_2.RedisEventBus();
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
            const service = yield this.serviceRepository.findById(id);
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
            const existingService = yield this.serviceRepository.findById(serviceId);
            if (!existingService) {
                throw new shared_1.BadRequestError("Service not found");
            }
            // Apply updates
            yield this.serviceRepository.updateService(serviceId, updates);
            // Return updated service
            return this.serviceRepository.findById(serviceId);
        });
    }
}
exports.ServiceService = ServiceService;
