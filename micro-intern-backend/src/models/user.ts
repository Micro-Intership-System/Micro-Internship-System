import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "student" | "employer" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;        // Stored hashed
  role: UserRole;

  // Student profile fields
  institution?: string;
  skills?: string[];
  bio?: string;
  profilePicture?: string;

  // Employer profile fields
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;

  comparePassword: (input: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "employer", "admin"],
      default: "student"
    },

    // STUDENT FIELDS
    institution: { type: String },
    skills: { type: [String], default: [] },
    bio: { type: String },
    profilePicture: { type: String },

    // EMPLOYER FIELDS
    companyName: { type: String },
    companyWebsite: { type: String },
    companyDescription: { type: String },
    companyLogo: { type: String },
  },
  { timestamps: true }
);


//
// 🔐 COMPARE PASSWORD METHOD
//
UserSchema.methods.comparePassword = async function (input: string) {
  return bcrypt.compare(input, this.password);
};

export const User = mongoose.model<IUser>("User", UserSchema);
