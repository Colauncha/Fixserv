import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../../config/cloudinary";
import fs from "fs";
import path from "path";
import { UserService } from "../../application/services/userService";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { BadRequestError, redis } from "@fixserv-colauncha/shared";
import { AuthService } from "../../application/services/authService";

import { JwtTokenService } from "../../infrastructure/services/jwtTokenService";
import { EmailService } from "../../infrastructure/services/emailServiceImpls";

const userRepository = new UserRepositoryImpl();
const userService = new UserService(userRepository);
const tokenService = new JwtTokenService();
const emailService = new EmailService();

const authService = new AuthService(userRepository, tokenService, emailService);

export const uploadProfilePicture = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).send({ error: "No file uploaded" });
  }
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "fixserv/profile_pictures",
    });

    //delete local temporary file
    fs.unlinkSync(path.resolve(filePath));
    //saeve the image URL to the user's profile in the database
    const updatedUser = await userService.updateProfilePicture(
      userId,
      result.secure_url
    );

    console.log("updatedUser", updatedUser.toJSON());

    // IMPORTANT: Invalidate cache first, then refresh with fresh data
    await authService.invalidateUserCache(userId);
    const freshUser = await authService.findUserById(userId);

    console.log("freshUser from cache refresh:", freshUser.toJSON());

    res.status(200).json({
      imageUrl: result.secure_url,
      message: "Profile picture uploaded successfully",
      user: freshUser.toJSON(),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send({ error: "Failed to upload profile picture" });
  }
};

export const uploadProducts = async (req: Request, res: Response) => {
  const clientId = req.params.id;
  const currentUser = req.currentUser!.id;

  if (currentUser !== clientId) {
    throw new BadRequestError("You are not authorized to upload products");
  }

  const { description, objectName } = req.body;

  const file = req.file;

  if (!file || !description || !objectName) {
    throw new BadRequestError(
      "Image, description and object name are required"
    );
  }
  try {
    const imageUrl = await cloudinary.uploader.upload(file.path, {
      folder: "fixserv/uploaded_products",
    });
    const product = {
      id: uuidv4(),
      imageUrl: imageUrl.secure_url,
      description,
      objectName,
      uploadedAt: new Date(),
    };
    //save the product to the user's uploaded products in the database
    await userRepository.addUploadedProduct(clientId, product);
    // IMPORTANT: Invalidate cache and get fresh data
    await authService.invalidateUserCache(clientId);
    // const user = await userRepository.findById(clientId);
    const freshUser = await authService.findUserById(clientId);

    //if (freshUser) {
    //  await redis.set(`user:${clientId}`, JSON.stringify(freshUser.toJSON//()), {
    //    EX: 600, // Cache for 10 minutes
    //  });
    //}
    console.log("toJSON result UP:", freshUser.toJSON());

    fs.unlinkSync(path.resolve(file.path)); // Delete local temporary file

    res.status(200).json({
      message: "Product uploaded successfully",
      product,
      user: freshUser.toJSON(),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).send({ error: "Failed to upload product" });
  }
};

//await redis.set(`user:${user.id}`, JSON.stringify(user), {
//  EX: 60 * 10, // Cache for 10 minutes
//});
