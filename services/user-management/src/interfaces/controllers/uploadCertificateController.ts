import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../../config/cloudinary";
import fs from "fs";
import path from "path";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { AuthService } from "../../application/services/authService";
import { JwtTokenService } from "../../infrastructure/services/jwtTokenService";
import { EmailService } from "../../infrastructure/services/emailServiceImpls";
import { CertificateType } from "../../domain/value-objects/certificate";

const userRepository = new UserRepositoryImpl();
const tokenService = new JwtTokenService();
const emailService = new EmailService();
const authService = new AuthService(userRepository, tokenService, emailService);

/**
 * Upload multiple certificates for an artisan
 * POST /api/artisan/:id/upload-certificates
 */
export const uploadCertificates = async (req: Request, res: Response) => {
  const artisanId = req.params.id;
  const currentUser = req.currentUser!;

  // Authorization check
  if (currentUser.id !== artisanId && currentUser.role !== "ADMIN") {
    throw new BadRequestError(
      "You are not authorized to upload certificates for this artisan",
    );
  }

  // Verify user is an artisan
  const user = await authService.findUserById(artisanId);
  if (user.role !== "ARTISAN") {
    throw new BadRequestError("Only artisans can upload certificates");
  }

  const files = req.files as Express.Multer.File[];
  const { certificateNames } = req.body; // JSON array of names for each certificate

  if (!files || files.length === 0) {
    throw new BadRequestError("At least one certificate file is required");
  }

  if (files.length > 5) {
    // Limit per upload
    throw new BadRequestError("Maximum 5 certificates can be uploaded at once");
  }

  // Parse certificate names if provided
  let names: string[] = [];
  if (certificateNames) {
    try {
      names = JSON.parse(certificateNames);
    } catch (error) {
      throw new BadRequestError("Invalid certificate names format");
    }
  }

  try {
    const uploadedCertificates = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const certificateName = names[i] || `Certificate ${i + 1}`;

      // Determine file type
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const isPDF = fileExtension === ".pdf";
      const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(
        fileExtension,
      );

      if (!isPDF && !isImage) {
        // Clean up already processed files
        files.forEach((f) => {
          if (fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        });
        throw new BadRequestError(
          "Only PDF and image files (JPG, PNG, WEBP) are allowed",
        );
      }

      // Upload to Cloudinary
      const uploadOptions: any = {
        folder: "fixserv/artisan_certificates",
        resource_type: isPDF ? "raw" : "image",
      };

      const result = await cloudinary.uploader.upload(file.path, uploadOptions);

      // Create certificate object
      const certificate = {
        id: uuidv4(),
        name: certificateName,
        fileUrl: result.secure_url,
        fileType: isPDF ? CertificateType.PDF : CertificateType.IMAGE,
        uploadedAt: new Date(),
        status: "PENDING", // Always pending for review
      };

      // Add to database
      await userRepository.addCertificate(artisanId, certificate);
      uploadedCertificates.push(certificate);

      // Delete local temporary file
      fs.unlinkSync(path.resolve(file.path));
    }

    // Invalidate cache and get fresh data
    await authService.invalidateUserCache(artisanId);
    const freshUser = await authService.findUserById(artisanId);

    // Notify admin (optional - you can implement this later)
    // await emailService.notifyAdminOfPendingCertificates(artisanId, uploadedCertificates.length);

    res.status(200).json({
      success: true,
      message: `${uploadedCertificates.length} certificate(s) uploaded successfully and submitted for review`,
      certificates: uploadedCertificates,
      user: freshUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Error uploading certificates:", error);

    // Clean up any remaining temporary files
    if (files) {
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    throw new BadRequestError(error.message || "Failed to upload certificates");
  }
};

/**
 * Delete a certificate
 * DELETE /api/artisan/:id/certificates/:certificateId
 */
export const deleteCertificate = async (req: Request, res: Response) => {
  const artisanId = req.params.id;
  const certificateId = req.params.certificateId;
  const currentUser = req.currentUser!;

  // Authorization check
  if (currentUser.id !== artisanId && currentUser.role !== "ADMIN") {
    throw new BadRequestError(
      "You are not authorized to delete certificates for this artisan",
    );
  }

  try {
    await userRepository.removeCertificate(artisanId, certificateId);

    // Invalidate cache and get fresh data
    await authService.invalidateUserCache(artisanId);
    const freshUser = await authService.findUserById(artisanId);

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
      user: freshUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Error deleting certificate:", error);
    throw new BadRequestError(error.message || "Failed to delete certificate");
  }
};

/**
 * Get artisan's certificates
 * GET /api/artisan/:id/certificates
 */
export const getArtisanCertificates = async (req: Request, res: Response) => {
  const artisanId = req.params.id;

  try {
    const user = await authService.findUserById(artisanId);

    if (user.role !== "ARTISAN") {
      throw new BadRequestError("User is not an artisan");
    }
    // FIX: Use getCertificates() method instead of accessing certificates directly
    const certificates = user.getCertificates();

    // Convert to JSON format
    const certificatesJSON = certificates.map((cert) => cert.toJSON());

    // Count by status
    const pendingCount = certificatesJSON.filter(
      (c: any) => c.status === "PENDING",
    ).length;
    const approvedCount = certificatesJSON.filter(
      (c: any) => c.status === "APPROVED",
    ).length;
    const rejectedCount = certificatesJSON.filter(
      (c: any) => c.status === "REJECTED",
    ).length;

    res.status(200).json({
      success: true,
      artisanId,
      totalCertificates: certificatesJSON.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      certificates: certificatesJSON,
    });
  } catch (error: any) {
    console.error("Error fetching certificates:", error);
    throw new BadRequestError(error.message || "Failed to fetch certificates");
  }
};

/**
 * ADMIN: Review certificate (approve/reject)
 * PATCH /api/admin/artisan/:id/certificates/:certificateId/review
 */
export const reviewCertificate = async (req: Request, res: Response) => {
  const artisanId = req.params.id;
  const certificateId = req.params.certificateId;
  const { status, rejectionReason } = req.body;
  const adminId = req.currentUser!.id;

  if (!status || !["APPROVED", "REJECTED"].includes(status)) {
    throw new BadRequestError('Status must be either "APPROVED" or "REJECTED"');
  }

  if (status === "REJECTED" && !rejectionReason) {
    throw new BadRequestError("Rejection reason is required");
  }

  try {
    await userRepository.updateCertificateStatus(
      artisanId,
      certificateId,
      status,
      adminId,
      rejectionReason,
    );

    // Invalidate cache and get fresh data
    await authService.invalidateUserCache(artisanId);
    const freshUser = await authService.findUserById(artisanId);

    // Send notification to artisan (optional)
    // await emailService.notifyArtisanOfCertificateReview(
    //   freshUser.email,
    //   status,
    //   rejectionReason
    // );

    res.status(200).json({
      success: true,
      message: `Certificate ${status.toLowerCase()} successfully`,
      user: freshUser.toJSON(),
    });
  } catch (error: any) {
    console.error("Error reviewing certificate:", error);
    throw new BadRequestError(error.message || "Failed to review certificate");
  }
};

/**
 * ADMIN: Get all artisans with pending certificates
 * GET /api/admin/certificates/pending
 */
export const getPendingCertificates = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const result = await userRepository.getArtisansWithPendingCertificates(
      page,
      limit,
    );

    // Extract pending certificates from each artisan
    const artisansWithCertificates = result.artisans.map((artisan) => {
      const artisanJSON = artisan.toJSON();
      const pendingCertificates = (artisanJSON.certificates || []).filter(
        (cert: any) => cert.status === "PENDING",
      );

      return {
        artisanId: artisan.id,
        artisanName: artisan.fullName,
        artisanEmail: artisan.email,
        businessName: (artisan as any).businessName,
        location: (artisan as any).location,
        pendingCertificates,
      };
    });

    res.status(200).json({
      success: true,
      results: artisansWithCertificates.length,
      total: result.total,
      currentPage: page,
      totalPages: Math.ceil(result.total / limit),
      artisans: artisansWithCertificates,
    });
  } catch (error: any) {
    console.error("Error fetching pending certificates:", error);
    throw new BadRequestError(
      error.message || "Failed to fetch pending certificates",
    );
  }
};

/**
 * ADMIN: Get certificate statistics
 * GET /api/admin/certificates/stats
 */
export const getCertificateStats = async (req: Request, res: Response) => {
  try {
    const pendingCertificates =
      await userRepository.getAllPendingCertificates();

    const totalPending = pendingCertificates.reduce(
      (sum, artisan) => sum + artisan.certificates.length,
      0,
    );

    res.status(200).json({
      success: true,
      stats: {
        totalArtisansWithPendingCertificates: pendingCertificates.length,
        totalPendingCertificates: totalPending,
      },
      artisans: pendingCertificates,
    });
  } catch (error: any) {
    console.error("Error fetching certificate stats:", error);
    throw new BadRequestError(
      error.message || "Failed to fetch certificate statistics",
    );
  }
};
