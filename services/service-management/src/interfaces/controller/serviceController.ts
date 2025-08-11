import { Request, Response } from "express";
import { ServiceService } from "../../application/services/serviceService";
import { BadRequestError } from "@fixserv-colauncha/shared";

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
        skillSet: service.skillSet.toArray(),
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
          rating: service.rating,
          skillSet: service.skillSet.toArray(),
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
      const artisanId = req.currentUser!.id;

      if (!serviceId) {
        throw new BadRequestError("Service ID is required");
      }

      const allowedFields = [
        "title",
        "description",
        "price",
        "estimatedDuration",
        "isActive",
      ];

      const validUpdates = Object.fromEntries(
        allowedFields
          .filter((key) => updates[key] !== undefined)
          .map((key) => [key, updates[key]])
      );

      await this.serviceService.updateService(
        serviceId,
        validUpdates,
        artisanId
      );

      res.status(200).json({
        success: true,
        message: "Service updated successfully",
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
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const services = await this.serviceService.getPaginatedServices(
        page,
        limit
      );
      res.status(200).json(
        services.map((service) => ({
          id: service.id,
          artisanId: service.artisanId,
          title: service.details.title,
          description: service.details.description,
          price: service.details.price,
          estimatedDuration: service.details.estimatedDuration,
          isActive: service.isActive,
          rating: service.rating,
          skillSet: service.skillSet.toArray(),
        }))
      );
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  }

  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const artisanId = req.currentUser!.id;
      if (!serviceId) {
        throw new BadRequestError("Service ID is required");
      }
      await this.serviceService.deleteService(serviceId, artisanId);
      res.status(204).send("Delete operation successfull");
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        console.error("Service deletion error:", error);
        res.status(500).json({ error: "Failed to delete service" });
      }
    }
  }
  async streamServices(req: Request, res: Response): Promise<void> {
    try {
      res.setHeader("Content-Type", "application/json");
      res.write("["); // opening JSON array

      const stream = await this.serviceService.streamServices();

      let first = true;

      stream.on("data", (doc) => {
        const service = {
          id: doc._id,
          artisanId: doc.artisanId,
          title: doc.title,
          description: doc.description,
          price: doc.price,
          estimatedDuration: doc.estimatedDuration,
          isActive: doc.isActive,
          rating: doc.rating,
          skillSet: doc.skillSet || [],
        };
        if (!first) {
          res.write(",");
        }
        res.write(JSON.stringify(service));
        first = false;
      });

      stream.on("end", () => {
        res.write("]");
        res.end();
      });

      stream.on("error", (err) => {
        console.error("Streaming error:", err);
        res.status(500).json({ error: "Streaming failed" });
      });
    } catch (err) {
      console.error("Streaming setup error:", err);
      res.status(500).json({ error: "Unexpected error" });
    }
  }

  async offerBaseService(req: Request, res: Response): Promise<void> {
    try {
      const artisanId = req.currentUser!.id;
      const { baseServiceId, price, estimatedDuration, skillSet } = req.body;

      if (!baseServiceId || !price || !estimatedDuration) {
        throw new BadRequestError(
          "baseServiceId, price, and estimatedDuration are required"
        );
      }

      const offeredService = await this.serviceService.offerBaseService(
        artisanId,
        baseServiceId,
        price,
        estimatedDuration,
        skillSet
      );

      res.status(201).json({
        id: offeredService.id,
        artisanId: offeredService.artisanId,
        baseServiceId: offeredService.baseServiceId,
        price: offeredService.price,
        estimatedDuration: offeredService.estimatedDuration,
        skillSet: offeredService.skillSet,
        isActive: offeredService.isActive,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
      } else {
        console.error("Offer base service error:", error);
        res.status(500).json({ error: "Failed to offer service" });
      }
    }
  }

  //async createBaseService(req: Request, res: Response): Promise<void> {
  //  try {
  //    const { title, description } = req.body;
  //
  //    if (!title || !description) {
  //      throw new BadRequestError("Title and description are required");
  //    }
  //
  //    const createdService = await this.serviceService.createBaseService//({
  //      title,
  //      description,
  //      createdBy: req.currentUser!.id, // Admin ID
  //    });
  //
  //    res
  //      .status(201)
  //      .json(
  //        new CreatedResponse(
  //          "Base service created successfully",
  //          createdService
  //        )
  //      );
  //  } catch (error: any) {
  //    res.status(400).json({
  //      success: false,
  //      message: "Failed to create base service",
  //      error: error.message,
  //    });
  //  }
  //}
}
