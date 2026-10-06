import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
  type InferSchemaType,
} from "mongoose";
import bcrypt from "bcryptjs";

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
      select: false, // don't return password by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).password;
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

// ---------- Types ----------

export type User = InferSchemaType<typeof userSchema>;

export type UserDocument = HydratedDocument<User> & {
  comparePassword(candidate: string): Promise<boolean>;
};

export type UserModel = Model<
  User,
  {},
  { comparePassword(candidate: string): Promise<boolean> }
>;

// ---------- Model ----------

export const UserModel = model<User, UserModel>("User", userSchema);
export default UserModel;
