import express from "express";
import { body } from "express-validator";
import { UserController } from "../../controllers/userController";
import { UserRepositoryImpl } from "../../../infrastructure/persistence/userRepositoryImpl";
import { UserService } from "../../../application/services/userService";
import { ValidateRequest } from "@fixserv-colauncha/shared";

const userRepository = new UserRepositoryImpl();
const userService = new UserService(userRepository);
const userController = new UserController(userService);
const router = express.Router();
const validate = new ValidateRequest();

router.post("/register", userController.register.bind(userController));

router.post(
  "/register-waitlist",
  userController.registerUserWaitlist.bind(userController)
);

// Email verification route
router.get("/verify-email", userController.verifyEmail.bind(userController));

// Resend verification email route
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Please provide a valid email")],
  validate.validateRequest,
  userController.resendVerificationEmail.bind(userController)
);

export { router as userRouter };
