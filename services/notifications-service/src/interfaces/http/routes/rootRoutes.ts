import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    service: "notifications-service",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "notifications-service",
    timestamp: new Date().toISOString(),
  });
});

export default router;
