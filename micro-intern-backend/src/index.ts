import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Routes
import authRoutes from "./routes/authRoutes";
import landingRoutes from "./routes/landingRoutes";
import internshipRoutes from "./routes/internshipRoutes";
import employerRoutes from "./routes/employerRoutes";
import studentRoutes from "./routes/studentRoutes";
import contactRoutes from "./routes/contactRoutes";
import messageRoutes from "./routes/messageRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import courseShopRoutes from "./routes/courseShopRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import taskChatRoutes from "./routes/taskChatRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import anomalyRoutes from "./routes/anomalyRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import jobManagementRoutes from "./routes/jobManagementRoutes";
import adminRoutes from "./routes/adminRoutes";
import uploadRoutes from "./routes/uploadRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (_req, res) => {
  res.send("Micro-Internship API is running");
});

// Route mounts
app.use("/api/auth", authRoutes);
app.use("/api/public", landingRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/shop", courseShopRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/task-chat", taskChatRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/jobs", jobManagementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Static endpoints
app.get("/api/public/landing/featured", (_req, res) => {
  const featuredInternships = [
    {
      id: "1",
      title: "UX Research Assistant — 3-Week Remote Internship",
      employer: "Nyancom Ltd.",
      location: "Remote (Bangladesh)",
      duration: "3 Weeks",
      budget: 4000,
      skills: ["User Research", "Survey Design", "Report Writing"],
      tags: ["ux", "remote"],
    },
    {
      id: "2",
      title: "Content Writer — Blog Posts",
      employer: "BrightPath Solutions",
      location: "Remote",
      duration: "1 Week",
      budget: 1500,
      skills: ["Content Writing"],
      tags: ["writing", "remote"],
    },
  ];

  res.json({ success: true, data: featuredInternships });
});

app.get("/api/public/reviews", (_req, res) => {
  const reviews = [
    { name: "Nafisa", role: "CSE Student", quote: "This platform helped me land my first paid project!" },
    { name: "Mr. Rahman", role: "HR Manager", quote: "We found skilled interns faster than before." },
    { name: "Sabbir", role: "Frontend Intern", quote: "The certificates look great on my portfolio." },
  ];

  res.json({ success: true, data: reviews });
});

// DB connect
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in .env");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI.trim());
    console.log("✅ MongoDB connected");
  } catch (err: any) {
    console.error("❌ MongoDB error:", err.message);
  }
};

connectDB();

// Optional email config verify (non-blocking)
import { verifyEmailConfig } from "./config/email";
verifyEmailConfig().catch((err) => console.warn("Email verification skipped:", err.message));

// Start server (ONLY ONCE)
const PORT = process.env.PORT || 1547;
app.listen(PORT, () => {
  console.log(`✅ API server listening on port ${PORT}`);
});
