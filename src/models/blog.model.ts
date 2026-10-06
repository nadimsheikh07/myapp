import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from 'mongoose';

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'The title field is required.'],
      trim: true,
      minlength: [3, 'The title must be at least 3 characters.'],
      maxlength: [200, 'The title may not be greater than 200 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'The slug field is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [4, 'The slug must be at least 4 characters.'],
      match: [/^[a-z0-9-]+$/, 'The slug format is invalid.'],
    },
    content: {
      type: String,
      required: [true, 'The content field is required.'],
      minlength: [10, 'The content must be at least 10 characters.'],
    },
    author: {
      type: String,
      required: [true, 'The author field is required.'],
      trim: true,
    },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------- Types ----------

export type Blog = InferSchemaType<typeof blogSchema>;
export type BlogDocument = HydratedDocument<Blog>;
export type BlogModel = Model<Blog>;

// ---------- Model ----------

export const BlogModel = model<Blog>('Blog', blogSchema);
export default BlogModel;