import { Router, type Request, type Response } from "express";
import healthRoutes from "./health.routes.ts";
import { getLiveness } from "../controllers/health.controller.ts";

const router = Router();

router.get("/", getLiveness);

router.use("/health", healthRoutes);

export default router;
