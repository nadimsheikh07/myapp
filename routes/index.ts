import { Router, type Request, type Response } from "express";
import healthRoutes from "./health.routes.ts";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

router.use("/health", healthRoutes);

export default router;
