import express, { Request, Response } from "express";
const rootRouter = express.Router();

rootRouter.get("/", (req: Request, res: Response) => {
  res.status(200).send({
    message: "Welcome to the Order Management Service",
    version: "1.0.0",
  });
});
rootRouter.get("/root/health", (req: Request, res: Response) => {
  res.status(200).send({
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

export default rootRouter;
