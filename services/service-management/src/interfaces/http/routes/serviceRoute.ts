import express, { Request, Response } from "express";
import { ServiceService } from "../../../application/services/serviceService";
import { ArtisanRepositoryImpl } from "../../../infrastructure/artisanRepositoryImpl";
import { ServiceRepositoryImpl } from "../../../infrastructure/serviceRepositoryImpl";
import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { requireRole } from "@fixserv-colauncha/shared";
import { ServiceController } from "../../controller/serviceController";

const router = express.Router();

const artisanRepository = new ArtisanRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();
const authenticate = new AuthMiddleware();

const serviceService = new ServiceService(serviceRepository, artisanRepository);
const serviceController = new ServiceController(serviceService);

router.post(
  "/createService",
  authenticate.protect,
  requireRole("ARTISAN"),
  serviceController.create.bind(serviceController)
);

router.get("/services", serviceController.getServices.bind(serviceController));

router.get("/stream", serviceController.streamServices.bind(serviceController));

router.get(
  "/artisan/:artisanId",
  authenticate.protect,
  requireRole("ARTISAN"),
  serviceController.listByArtisan.bind(serviceController)
);

router.get(
  "/:serviceId",
  serviceController.getServiceById.bind(serviceController)
);

router.patch(
  "/:serviceId",
  serviceController.updateService.bind(serviceController)
);

router.delete(
  "/:serviceId",
  authenticate.protect,
  requireRole("ARTISAN"),
  serviceController.deleteService.bind(serviceController)
);

export { router as serviceRouter };
