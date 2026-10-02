import type { Request, Response, NextFunction } from "express";
import Blog from "../models/blog.model.ts";

// GET /api/blogs
export const getBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { author, title, content, page = "1", limit = "10" } = req.query;

    // Build filter object dynamically
    const filter: Record<string, unknown> = {};

    if (author) {
      filter.author = { $regex: author as string, $options: "i" };
    }
    if (title) {
      filter.title = { $regex: title as string, $options: "i" };
    }
    if (content) {
      filter.content = { $regex: content as string, $options: "i" };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      count: blogs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: blogs,
    });
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
