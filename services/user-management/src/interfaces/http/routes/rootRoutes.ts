import express, { Request, Response } from "express";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
const rootRouter = express.Router();

rootRouter.get("/", (req: Request, res: Response) => {
  res.status(200).send({
    message: "Welcome to the User Management Service",
    version: "1.0.0",
  });
});
rootRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).send({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

rootRouter.get("/debug-cache/:email", async (req, res) => {
  const key = `user:email:${req.params.email}`;
  const raw = await redis.get(key);
  res.json({ key, raw: JSON.parse(raw || "{}") });
});

export default rootRouter;
