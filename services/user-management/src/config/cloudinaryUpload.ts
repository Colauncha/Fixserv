import cloudinary from "./cloudinary";
import fs from "fs";
import path from "path";

interface UploadOptions {
  folder: string;
  resourceType?: "image" | "raw" | "auto";
  transformation?: object[];
  maxFileSizeMB?: number;
}

export async function uploadToCloudinary(
  filePath: string,
  options: UploadOptions,
): Promise<string> {
  try {
    // Verify file exists before attempting upload
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for upload");
    }

    // Check file size before uploading
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    const maxSize = options.maxFileSizeMB || 10;

    if (fileSizeMB > maxSize) {
      throw new Error(
        `File size ${fileSizeMB.toFixed(1)}MB exceeds maximum allowed size of ${maxSize}MB`,
      );
    }

    const isPDF = options.resourceType === "raw";

    const uploadOptions: any = {
      folder: options.folder,
      resource_type: options.resourceType || "image",
      timeout: 60000, // 60 second timeout
      // Only apply transformations to images, not PDFs
      ...(!isPDF && {
        transformation: options.transformation || [
          { quality: "auto:good" }, // auto compress
          { fetch_format: "auto" }, // auto format (webp for browsers that support it)
        ],
      }),
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result.secure_url;
  } finally {
    // Always clean up temp file whether upload succeeded or failed
    cleanupTempFile(filePath);
  }
}

export function cleanupTempFile(filePath: string): void {
  try {
    if (filePath && fs.existsSync(path.resolve(filePath))) {
      fs.unlinkSync(path.resolve(filePath));
    }
  } catch (cleanupError: any) {
    // Log but don't throw — cleanup failure shouldn't break the response
    console.error(
      "Failed to cleanup temp file:",
      filePath,
      cleanupError.message,
    );
  }
}
