import express, { Request, Response } from "express";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { JwtTokenService } from "../../../infrastructure/services/jwtTokenService";
import { AuthService } from "../../../application/services/authService";
import { AuthController } from "../../controllers/AuthController";
import { AuthMiddleware } from "../../middlewares/authMiddleware";

const router = express.Router();

const userRepository = new UserRepositoryImpl();
const tokenService = new JwtTokenService();
const authService = new AuthService(userRepository, tokenService);
const authController = new AuthController(authService);

const authMiddleware = new AuthMiddleware();

router.post(
  "/login",
  // authMiddleware.protect,
  authController.login.bind(authController)
);

router.post("/logout", authController.logout.bind(authController));

router.get(
  "/currentUser",
  authMiddleware.protect,
  // authMiddleware.requireAuth,
  async (req: Request, res: Response) => {
    // const user = await userRepository.findById//(req.currentUser!.id);
    res.status(200).send("hi");
  }
);

export { router as adminRouter };
