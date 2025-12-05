import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "employer" | "admin";
  comparePassword: (inputPassword: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "employer", "admin"], default: "student" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (inputPassword: string) {
  return bcrypt.compare(inputPassword, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
