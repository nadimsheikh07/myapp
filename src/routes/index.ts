import { Router, type Request, type Response } from "express";
import healthRoutes from "./health.routes.ts";
import { getLiveness } from "../controllers/health.controller.ts";
import blogRoutes from "./blog.routes.ts";

const router = Router();

router.get("/", getLiveness);

router.use("/health", healthRoutes);
router.use("/blogs", blogRoutes);

export default router;
