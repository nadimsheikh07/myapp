import { Router, type Request, type Response } from "express";
import { getHealth } from "../controllers/health.controller.ts";

const router = Router();

router.get("/", getHealth);

export default router;
