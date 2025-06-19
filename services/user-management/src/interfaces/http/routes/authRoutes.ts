import express, { Request, Response } from "express";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { JwtTokenService } from "../../../infrastructure/services/jwtTokenService";
import { AuthService } from "../../../application/services/authService";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "@fixserv-colauncha/shared";
import { requireRole } from "@fixserv-colauncha/shared";
import { ValidateRequest } from "@fixserv-colauncha/shared";
import { body } from "express-validator";

const router = express.Router();

const userRepository = new UserRepositoryImpl();
const tokenService = new JwtTokenService();
const authService = new AuthService(userRepository, tokenService);
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

router.get(
  "/currentUser",
  authMiddleware.protect,
  requireRole("ADMIN", "ARTISAN"),
  async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.currentUser!.id);
    res.status(200).send(user);
  }
);

router.get("/artisan/:id", authController.findUserById.bind(authController));
router.get(
  "/client/:clientId",
  authController.findUserById.bind(authController)
);

router.patch(
  "/:id",
  authMiddleware.protect,
  requireRole("ADMIN", "ARTISAN", "CLIENT"),
  authController.updateUser.bind(authController)
);

export { router as adminRouter };
