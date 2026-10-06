import { Router } from "express";
import {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
} from "../controllers/user.controller.ts";

const router = Router();

router.get("/", getUsers);
router.get("/email/:email", getUserByEmail); // must be before /:id
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/password", updatePassword);
router.delete("/:id", deleteUser);

export default router;
