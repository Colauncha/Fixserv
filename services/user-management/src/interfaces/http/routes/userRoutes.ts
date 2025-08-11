import express from "express";
import { UserController } from "../../controllers/userController";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { UserService } from "../../../application/services/userService";

const userRepository = new UserRepositoryImpl();
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const router = express.Router();

router.post("/register", userController.register.bind(userController));

export { router as userRouter };
