import express, { Request, Response } from "express";
import {
  uploadProfilePicture,
  uploadProducts,
} from "../../../interfaces/controllers/uploadPictureController";
import { upload } from "../../../interfaces/middlewares/multerMiddleware";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";
const authMiddleware = new AuthMiddleware();
const router = express.Router();

router.post(
  "/:id/profile-picture",
  upload.single("profilePicture"),
  (req: Request, res: Response, next) => {
    Promise.resolve(uploadProfilePicture(req, res)).catch(next);
  }
);

router.post(
  "/:id/upload-products",
  authMiddleware.protect,
  requireRole("CLIENT"),
  upload.single("productImage"),
  (req: Request, res: Response, next) => {
    Promise.resolve(uploadProducts(req, res)).catch(next);
  }
);

export { router as uploadRouter };
