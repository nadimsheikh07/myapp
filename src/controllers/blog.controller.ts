import type { Request, Response, NextFunction } from "express";
import Blog from "../models/blog.model.ts";

// GET /api/blogs
export const getBlogs = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ count: blogs.length, data: blogs });
  } catch (err) {
    next(err);
  }
};

// GET /api/blogs/:id
export const getBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id).lean();

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.status(200).json({ data: blog });
  } catch (err) {
    next(err);
  }
};

// GET /api/blogs/slug/:slug
export const getBlogBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).lean();

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.status(200).json({ data: blog });
  } catch (err) {
    next(err);
  }
};

// POST /api/blogs
export const createBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, slug, content, author, tags, published } = req.body;

    const blog = await Blog.create({
      title,
      slug,
      content,
      author,
      tags,
      published,
    });

    res.status(201).json({ data: blog });
  } catch (err) {
    next(err);
  }
};

// PUT /api/blogs/:id
export const updateBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.status(200).json({ data: blog });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/blogs/:id
export const deleteBlog = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
