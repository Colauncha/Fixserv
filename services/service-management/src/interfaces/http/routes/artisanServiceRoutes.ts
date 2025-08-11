import express from "express";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
import { OfferedServiceRepositoryImpl } from "../../../infrastructure/offeredServiceRepoImpl";
import { BaseServiceRepositoryImpl } from "../../../infrastructure/baseServiceRepoImpl";
import { ArtisanServiceManager } from "../../../application/services/artisanServiceManager";
import { ArtisanServiceController } from "../../controller/artisanServiceController";

const router = express.Router();

const authMiddleware = new AuthMiddleware();

const offeredRepo = new OfferedServiceRepositoryImpl();
const baseRepo = new BaseServiceRepositoryImpl();
const artisanManager = new ArtisanServiceManager(offeredRepo, baseRepo);
const controller = new ArtisanServiceController(artisanManager);

router.post(
  "/",
  authMiddleware.protect,
  requireRole("ARTISAN"),
  controller.offerService
);

export { router as artisanServiceRoutes };
