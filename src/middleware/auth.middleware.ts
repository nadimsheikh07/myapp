import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized." });
  }
};

export const restrictTo =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = (req as any).user?.role;
    if (!roles.includes(role)) {
      res.status(403).json({ message: "Forbidden." });
      return;
    }
    next();
  };
