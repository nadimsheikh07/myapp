import { Router } from "express";
import {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller.ts";

const router = Router();

// ⚠️ /slug/:slug must come BEFORE /:id
router.get("/slug/:slug", getBlogBySlug);

router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
