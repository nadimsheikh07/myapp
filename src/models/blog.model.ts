import { Schema, model, type InferRawDocType } from "mongoose";

const blogSchemaDefinition = {
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, minLength: 4 },
  content: { type: String, required: true },
  author: { type: String, required: true },
  tags: { type: [String], default: [] },
  published: { type: Boolean, default: false },
} as const;

const blogSchema = new Schema(blogSchemaDefinition, {
  timestamps: true,
});

export type BlogDocument = InferRawDocType<typeof blogSchemaDefinition>;

export const Blog = model("Blog", blogSchema);
export default Blog;
