import express, { Request, Response } from "express";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { JwtTokenService } from "../../../infrastructure/services/jwtTokenService";
import { AuthService } from "../../../application/services/authService";
import { AuthController } from "../../../interfaces/controllers/AuthController";
import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { requireRole } from "@fixserv-colauncha/shared";
import { ValidateRequest } from "@fixserv-colauncha/shared";
import { body } from "express-validator";
import { EmailService } from "../../../infrastructure/services/emailServiceImpls";

const router = express.Router();

const emailService = new EmailService();
const userRepository = new UserRepositoryImpl();
const tokenService = new JwtTokenService();
const authService = new AuthService(userRepository, tokenService, emailService);
const authController = new AuthController(authService);

const authMiddleware = new AuthMiddleware();
const validate = new ValidateRequest();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  validate.validateRequest,
  authController.login.bind(authController)
);

router.post(
  "/logout",
  authMiddleware.protect,
  authController.logout.bind(authController)
);

router.get("/getAll", authController.getAllUsers.bind(authController));

router.get(
  "/currentUser",
  authMiddleware.protect,
  requireRole("ADMIN", "ARTISAN", "CLIENT"),
  async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.currentUser!.id);
    res.status(200).send(user);
  }
);

router.post(
  "/forgot-password",
  authController.forgotPassword.bind(authController)
);

router.post("/google-login", authController.googleLogin.bind(authController));

router.get(
  "/reset-password",
  authController.showResetPasswordForm.bind(authController)
);

router.patch(
  "/reset-password",
  [
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  validate.validateRequest,
  authController.resetPassword.bind(authController)
);

router.get("/user/:id", authController.findUserById.bind(authController));

router.get(
  "/users/email/:email",
  authController.findUserByEmail.bind(authController)
);

router.patch(
  "/:id",
  authMiddleware.protect,
  requireRole("ADMIN", "ARTISAN", "CLIENT"),
  authController.updateUser.bind(authController)
);

export { router as adminRouter };
