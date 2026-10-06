import { Router } from "express";
import {
  signup,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../controllers/auth.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
