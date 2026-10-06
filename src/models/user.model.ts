import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
  type InferSchemaType,
} from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken"; // ✅ from jsonwebtoken

// ---------- Schema ----------

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "The name field is required."],
      trim: true,
      minlength: [3, "The name must be at least 3 characters."],
      maxlength: [100, "The name may not be greater than 100 characters."],
    },
    email: {
      type: String,
      required: [true, "The email field is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "The email field must be a valid email address.",
      ],
    },
    mobile: {
      type: String,
      required: [true, "The mobile field is required."],
      unique: true,
      trim: true,
      match: [
        /^[0-9]{10,15}$/,
        "The mobile field must be a valid phone number.",
      ],
    },
    password: {
      type: String,
      required: [true, "The password field is required."],
      minlength: [6, "The password must be at least 6 characters."],
      maxlength: [128, "The password may not be greater than 128 characters."],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{};:'",.<>\/\\|`~])[A-Za-z\d@$!%*?&#^()_\-+=\[\]{};:'",.<>\/\\|`~]{6,}$/,
        "The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      ],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "The role must be either user or admin.",
      },
      default: "user",
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).refreshToken;
        delete (ret as any).passwordResetToken;
        delete (ret as any).passwordResetExpires;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// ---------- Indexes ----------

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ mobile: 1 }, { unique: true });
userSchema.index({ role: 1 });

// ---------- Virtuals ----------

userSchema.virtual("isEmailVerified").get(function () {
  return this.emailVerifiedAt !== null;
});

// ---------- Hooks ----------

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ---------- Instance Methods ----------

userSchema.methods.comparePassword = function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "15m") as SignOptions["expiresIn"];

  return jwt.sign(
    {
      sub: this._id.toString(),
      email: this.email,
      role: this.role,
    },
    secret,
    { expiresIn },
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
    "7d") as SignOptions["expiresIn"];

  return jwt.sign({ sub: this._id.toString() }, secret, { expiresIn });
};

userSchema.methods.createPasswordResetToken = function (): string {
  // Raw token sent to user via email
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hashed token stored in DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Expires in 15 minutes
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return rawToken;
};

// ---------- Types ----------

export type User = InferSchemaType<typeof userSchema>;

export type UserMethods = {
  comparePassword(candidate: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  createPasswordResetToken(): string;
};

export type UserDocument = HydratedDocument<User, UserMethods>;

export type UserModel = Model<User, {}, UserMethods>;

// ---------- Model ----------

export const UserModel = model<User, UserModel>("User", userSchema);
export default UserModel;
