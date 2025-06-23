"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../../controllers/userController");
const userRepositoryImpl_1 = require("../../../infrastructure/persistence/userRepositoryImpl");
const userService_1 = require("../../../application/services/userService");
const jwtTokenService_1 = require("../../../infrastructure/services/jwtTokenService");
const userRepository = new userRepositoryImpl_1.UserRepositoryImpl();
const tokenService = new jwtTokenService_1.JwtTokenService();
const userService = new userService_1.UserService(userRepository, tokenService);
const userController = new userController_1.UserController(userService);
const router = express_1.default.Router();
exports.userRouter = router;
//@ts-ignore
router.post("/register", userController.register.bind(userController));
router.get("/artisans", (req, res) => userController.users(req, res));
router.get("/", userController.test.bind(userController));
