import { type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";

export interface AppError extends Error {
  status?: number;
  code?: number | string;
  keyValue?: Record<string, any>;
  errors?: Record<string, mongoose.Error.ValidatorError>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Mongoose validation
  if (err.name === "ValidationError" && err.errors) {
    const errors: Record<string, string[]> = {};
    for (const field of Object.keys(err.errors)) {
      errors[field] = [err.errors[field].message];
    }
    res.status(422).json({
      message: "The given data was invalid.",
      errors,
    });
    return;
  }

  // Duplicate key
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    res.status(422).json({
      message: "The given data was invalid.",
      errors: { [field]: [`The ${field} has already been taken.`] },
    });
    return;
  }

  res.status(err.status ?? 500).json({
    message: err.message || "Server Error",
  });
};
