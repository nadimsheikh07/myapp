import type { Request, Response, NextFunction } from "express";
import UserModel from "../models/user.model.ts";

// GET /api/users
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, mobile, page = "1", limit = "10" } = req.query;

    // Build filter object dynamically
    const filter: Record<string, unknown> = {};

    if (name) {
      filter.name = { $regex: name as string, $options: "i" };
    }
    if (email) {
      filter.email = { $regex: email as string, $options: "i" };
    }
    if (mobile) {
      filter.mobile = { $regex: mobile as string, $options: "i" };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    res.status(200).json({
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/email/:email
export const getUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await UserModel.findOne({ email: req.params.email }).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, mobile, password } = req.body;

    const user = await UserModel.create({
      name,
      email,
      mobile,
      password,
    });

    // Strip password before returning
    const userObj = user.toObject();
    delete (userObj as { password?: string }).password;

    res.status(201).json({ data: userObj });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Never allow raw password update through this route
    const { password, ...updates } = req.body;

    const user = await UserModel.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/password
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.params.id).select("+password");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors: {
          currentPassword: currentPassword
            ? []
            : ["The currentPassword field is required."],
          newPassword: newPassword
            ? []
            : ["The newPassword field is required."],
        },
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    user.password = newPassword; // pre('save') hook hashes it
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
