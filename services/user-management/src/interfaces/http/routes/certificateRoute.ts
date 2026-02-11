// interfaces/routes/certificateRoutes.ts

import express, { Request, Response } from "express";
import {
  uploadCertificates,
  deleteCertificate,
  getArtisanCertificates,
  reviewCertificate,
  getPendingCertificates,
  getCertificateStats,
} from "../../../interfaces/controllers/uploadCertificateController";
import { upload } from "../../../interfaces/middlewares/multerMiddleware";
import { AuthMiddleware, requireRole } from "@fixserv-colauncha/shared";

const authMiddleware = new AuthMiddleware();
const router = express.Router();

/**
 * ARTISAN ROUTES
 */

// Upload multiple certificates
// POST /api/artisan/:id/upload-certificates
// Body (multipart/form-data):
//   - files: certificate files (max 5)
//   - certificateNames: JSON array of names ["Certificate 1", "Certificate 2"]
router.post(
  "/:id/upload-certificates",
  authMiddleware.protect,
  requireRole("ARTISAN", "ADMIN"),
  upload.array("certificates", 5), // Accept up to 5 files
  (req: Request, res: Response, next) => {
    Promise.resolve(uploadCertificates(req, res)).catch(next);
  },
);

// Get artisan's certificates
// GET /api/artisan/:id/certificates
router.get(
  "/:id/certificates",
  authMiddleware.protect,
  (req: Request, res: Response, next) => {
    Promise.resolve(getArtisanCertificates(req, res)).catch(next);
  },
);

// Delete a certificate
// DELETE /api/artisan/:id/certificates/:certificateId
router.delete(
  "/:id/certificates/:certificateId",
  authMiddleware.protect,
  requireRole("ARTISAN", "ADMIN"),
  (req: Request, res: Response, next) => {
    Promise.resolve(deleteCertificate(req, res)).catch(next);
  },
);

/**
 * ADMIN ROUTES
 */

// Review a certificate (approve/reject)
// PATCH /api/admin/artisan/:id/certificates/:certificateId/review
// Body: { status: "APPROVED" | "REJECTED", rejectionReason?: string }
router.patch(
  "/admin/artisan/:id/certificates/:certificateId/review",
  authMiddleware.protect,
  requireRole("ADMIN"),
  (req: Request, res: Response, next) => {
    Promise.resolve(reviewCertificate(req, res)).catch(next);
  },
);

// Get all artisans with pending certificates
// GET /api/admin/certificates/pending?page=1&limit=10
router.get(
  "/admin/certificates/pending",
  authMiddleware.protect,
  requireRole("ADMIN"),
  (req: Request, res: Response, next) => {
    Promise.resolve(getPendingCertificates(req, res)).catch(next);
  },
);

// Get certificate statistics
// GET /api/admin/certificates/stats
router.get(
  "/admin/certificates/stats",
  authMiddleware.protect,
  requireRole("ADMIN"),
  (req: Request, res: Response, next) => {
    Promise.resolve(getCertificateStats(req, res)).catch(next);
  },
);

export { router as certificateRouter };
