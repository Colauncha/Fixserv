import express from "express";
import { UserController } from "../../controllers/userController";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { UserService } from "../../../application/services/userService";
import { JwtTokenService } from "../../../infrastructure/services/jwtTokenService";

const userRepository = new UserRepositoryImpl();
const tokenService = new JwtTokenService();
const userService = new UserService(userRepository, tokenService);
const userController = new UserController(userService);
const router = express.Router();

//@ts-ignore
router.post("/register", userController.register.bind(userController));

router.get("/artisans", (req, res) => userController.users(req, res));

router.get("/", userController.test.bind(userController));

export { router as userRouter };
