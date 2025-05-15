import { Request, Response } from "express";
import { ServiceService } from "../../application/services/serviceService";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { NotFoundError } from "@fixserv-colauncha/shared";

export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, price, estimatedDuration, rating } = req.body;

      // Input validation
      if (!title || !description || price === undefined || !estimatedDuration) {
        throw new BadRequestError("Missing required fields");
      }

      if (typeof price !== "number" || price <= 0) {
        throw new BadRequestError("Price must be a positive number");
      }

      const service = await this.serviceService.createService(
        req.currentUser!.id,
        title,
        description,
        price,
        estimatedDuration,
        rating
      );

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
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes("Artisan")) {
        res.status(404).json({ error: error.message });
      } else {
        console.error("Service creation error:", error);
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  }

  async listByArtisan(req: Request, res: Response): Promise<void> {
    try {
      const { artisanId } = req.params;

      if (!artisanId) {
        throw new BadRequestError("Artisan ID is required");
      }

      const services = await this.serviceService.listArtisanServices(artisanId);

      res.status(200).json(
        services.map((service) => ({
          id: service.id,
          title: service.details.title,
          description: service.details.description,
          price: service.details.price,
          estimatedDuration: service.details.estimatedDuration,
          isActive: service.isActive,
        }))
      );
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Service listing error:", error);
        res.status(500).json({ error: "Failed to fetch services" });
      }
    }
  }
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      if (!serviceId) {
        throw new BadRequestError("Service ID is required");
      }
      const service = await this.serviceService.getServiceById(serviceId);
      res.status(200).json(service);
    } catch (error: any) {}
  }

  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const updates = req.body;

      if (!serviceId) {
        throw new BadRequestError("Service ID is required");
      }

      const allowedFields = [
        "title",
        "description",
        "price",
        "estimatedDuration",
        "isActive",
        "rating",
      ];

      const validUpdates = Object.fromEntries(
        allowedFields
          .filter((key) => updates[key] !== undefined)
          .map((key) => [key, updates[key]])
      );

      const updatedService = await this.serviceService.updateService(
        serviceId,
        validUpdates
      );

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
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        console.error("Service update error:", error);
        res.status(500).json({ error: "Failed to update service" });
      }
    }
  }
}
