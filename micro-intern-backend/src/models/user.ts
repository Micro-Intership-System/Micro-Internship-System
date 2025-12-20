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

  // Gamification fields (for students)
  gold?: number;           // Currency earned from completed tasks
  xp?: number;             // Experience points
  starRating?: number;     // 1-5 star rating (average from employer reviews)
  totalTasksCompleted?: number;
  averageCompletionTime?: number; // Average days to complete tasks
  completedCourses?: string[]; // Course IDs that student has completed

  // Employer profile fields
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;
  isVerified?: boolean;    // Employer verification status
  restrictionUntil?: Date; // Date until which employer has restrictions
  canOnlyPostLowPriority?: boolean; // If true, employer can only post low priority jobs

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

    // Gamification fields (for students)
    gold: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    starRating: { type: Number, min: 1, max: 5, default: 1 },
    totalTasksCompleted: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 }, // in days
    completedCourses: [{ type: String }], // Course IDs

    // EMPLOYER FIELDS
    companyName: { type: String },
    companyWebsite: { type: String },
    companyDescription: { type: String },
    companyLogo: { type: String },
    isVerified: { type: Boolean, default: false },
    restrictionUntil: { type: Date }, // Date until which employer has restrictions
    canOnlyPostLowPriority: { type: Boolean, default: false }, // If true, employer can only post low priority jobs
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
