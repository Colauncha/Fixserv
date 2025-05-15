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
exports.ServiceController = void 0;
const shared_1 = require("@fixserv-colauncha/shared");
class ServiceController {
    constructor(serviceService) {
        this.serviceService = serviceService;
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, description, price, estimatedDuration, rating } = req.body;
                // Input validation
                if (!title || !description || price === undefined || !estimatedDuration) {
                    throw new shared_1.BadRequestError("Missing required fields");
                }
                if (typeof price !== "number" || price <= 0) {
                    throw new shared_1.BadRequestError("Price must be a positive number");
                }
                const service = yield this.serviceService.createService(req.currentUser.id, title, description, price, estimatedDuration, rating);
                res.status(201).json({
                    id: service.id,
                    artisanId: service.artisanId,
                    title: service.details.title,
                    description: service.details.description,
                    price: service.details.price,
                    estimatedDuration: service.details.estimatedDuration,
                    isActive: service.isActive,
                    rating: service.rating,
                });
            }
            catch (error) {
                if (error instanceof shared_1.BadRequestError) {
                    res.status(400).json({ error: error.message });
                }
                else if (error.message.includes("Artisan")) {
                    res.status(404).json({ error: error.message });
                }
                else {
                    console.error("Service creation error:", error);
                    res.status(500).json({ error: "Failed to create service" });
                }
            }
        });
    }
    listByArtisan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { artisanId } = req.params;
                if (!artisanId) {
                    throw new shared_1.BadRequestError("Artisan ID is required");
                }
                const services = yield this.serviceService.listArtisanServices(artisanId);
                res.status(200).json(services.map((service) => ({
                    id: service.id,
                    title: service.details.title,
                    description: service.details.description,
                    price: service.details.price,
                    estimatedDuration: service.details.estimatedDuration,
                    isActive: service.isActive,
                })));
            }
            catch (error) {
                if (error instanceof shared_1.BadRequestError) {
                    res.status(400).json({ error: error.message });
                }
                else {
                    console.error("Service listing error:", error);
                    res.status(500).json({ error: "Failed to fetch services" });
                }
            }
        });
    }
    getServiceById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { serviceId } = req.params;
                if (!serviceId) {
                    throw new shared_1.BadRequestError("Service ID is required");
                }
                const service = yield this.serviceService.getServiceById(serviceId);
                res.status(200).json(service);
            }
            catch (error) { }
        });
    }
    updateService(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { serviceId } = req.params;
                const updates = req.body;
                if (!serviceId) {
                    throw new shared_1.BadRequestError("Service ID is required");
                }
                const allowedFields = [
                    "title",
                    "description",
                    "price",
                    "estimatedDuration",
                    "isActive",
                    "rating",
                ];
                const validUpdates = Object.fromEntries(allowedFields
                    .filter((key) => updates[key] !== undefined)
                    .map((key) => [key, updates[key]]));
                const updatedService = yield this.serviceService.updateService(serviceId, validUpdates);
                res.status(200).json({
                    id: updatedService.id,
                    artisanId: updatedService.artisanId,
                    title: updatedService.details.title,
                    description: updatedService.details.description,
                    price: updatedService.details.price,
                    estimatedDuration: updatedService.details.estimatedDuration,
                    isActive: updatedService.isActive,
                    rating: updatedService.rating,
                });
            }
            catch (error) {
                if (error instanceof shared_1.BadRequestError) {
                    res.status(400).json({ error: error.message });
                }
                else if (error.message.includes("not found")) {
                    res.status(404).json({ error: error.message });
                }
                else {
                    console.error("Service update error:", error);
                    res.status(500).json({ error: "Failed to update service" });
                }
            }
        });
    }
}
exports.ServiceController = ServiceController;
