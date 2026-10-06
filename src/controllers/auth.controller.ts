import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import User from "../models/user.model.ts";
import { sendMail, passwordResetEmail } from "../utils/mailer.ts";

// ---------- Cookie config ----------

const REFRESH_COOKIE = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// ---------- Helpers ----------

const publicUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ============================================================
// POST /api/auth/signup
// ============================================================
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, mobile, password } = req.body;

    const exists = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { mobile }],
    });

    if (exists) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors: {
          ...(exists.email === email?.toLowerCase() && {
            email: ["The email has already been taken."],
          }),
          ...(exists.mobile === mobile && {
            mobile: ["The mobile has already been taken."],
          }),
        },
      });
      return;
    }

    const user = await User.create({ name, email, mobile, password });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    res.status(201).json({
      data: publicUser(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/signin
// ============================================================
export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors: {
          ...(!email && { email: ["The email field is required."] }),
          ...(!password && { password: ["The password field is required."] }),
        },
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials." });
      return;
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    res.status(200).json({
      data: publicUser(user),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/signout
// ============================================================
export const signout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (token) {
      await User.updateOne(
        { refreshToken: token },
        { $unset: { refreshToken: 1 } },
      );
    }

    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "Signed out successfully." });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors: { email: ["The email field is required."] },
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success (don't leak which emails exist)
    if (!user) {
      res.status(200).json({
        message: "If that email exists, a reset link has been sent.",
      });
      return;
    }

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    try {
      await sendMail({
        to: String(user.email),
        subject: "Password Reset Request",
        html: passwordResetEmail(String(user.name), resetUrl),
      });
    } catch (mailErr) {
      // Roll back token if mail fails
      user.passwordResetToken = undefined as any;
      user.passwordResetExpires = undefined as any;
      await user.save({ validateBeforeSave: false });
      next(mailErr);
      return;
    }

    res.status(200).json({
      message: "If that email exists, a reset link has been sent.",
      // Remove in production:
      ...(process.env.NODE_ENV !== "production" && { resetUrl }),
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/reset-password/:token
// ============================================================
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.params.token as string;
    const { password } = req.body;

    if (!password) {
      res.status(422).json({
        message: "The given data was invalid.",
        errors: { password: ["The password field is required."] },
      });
      return;
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400).json({ message: "Token is invalid or has expired." });
      return;
    }

    user.password = password; // pre('save') hashes it
    user.passwordResetToken = undefined as any;
    user.passwordResetExpires = undefined as any;
    user.refreshToken = undefined as any; // sign out everywhere
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/auth/profile  (protected)
// ============================================================
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.sub;

    const user = await User.findById(userId).lean();

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json({ data: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /api/auth/profile  (protected)
// ============================================================
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user?.sub;
    const { name, email, mobile } = req.body;

    // Ensure email/mobile aren't taken by someone else
    if (email || mobile) {
      const or: Record<string, unknown>[] = [];
      if (email) or.push({ email: email.toLowerCase() });
      if (mobile) or.push({ mobile });

      const conflict = await User.findOne({
        _id: { $ne: userId },
        $or: or,
      });

      if (conflict) {
        res.status(422).json({
          message: "The given data was invalid.",
          errors: {
            ...(conflict.email === email?.toLowerCase() && {
              email: ["The email has already been taken."],
            }),
            ...(conflict.mobile === mobile && {
              mobile: ["The mobile has already been taken."],
            }),
          },
        });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(mobile && { mobile }),
      },
      { new: true, runValidators: true },
    );

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json({ data: publicUser(user) });
  } catch (err) {
    next(err);
  }
};
