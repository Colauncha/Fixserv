import { BadRequestError } from "@fixserv-colauncha/shared";
import multer from "multer";
import path from "path";
import fs from "fs";

// Use absolute path — works in both dev and production
const uploadDir = path.join(process.cwd(), "uploads");

// Create directory if it doesn't exist at runtime
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadDir}`);
}
/*
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // cb(null, `${Date.now()}-${file.originalname}`);

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
*/
const storage = multer.memoryStorage();
// For profile pictures and products — images only
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed") as any, false);
    }
  },
});

// For certificates — images and PDFs
export const certificateUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for PDFs
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only JPG, PNG, WEBP and PDF files are allowed") as any,
        false,
      );
    }
  },
});

export const upload = multer({ storage });
