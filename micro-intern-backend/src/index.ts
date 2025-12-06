import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import landingRoutes from "./routes/landingRoutes";
import internshipRoutes from "./routes/internshipRoutes";
import employerRoutes from "./routes/employerRoutes";
import studentRoutes from "./routes/studentRoutes";
import contactRoutes from "./routes/contactRoutes";
import messageRoutes from "./routes/messageRoutes";



dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Vite frontend
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// simple test route
app.get("/", (_req, res) => {
  res.send("Micro-Internship API is running");
});

// 🔴 IMP
app.use("/api/auth", authRoutes);
// Public routes (Feature-01)
app.use("/api/public", landingRoutes);
// Internship routes (Feature-02)
app.use("/api/internships", internshipRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);


const PORT = process.env.PORT || 1547;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));


// === Feature-01: Landing Page APIs ===

// Temporarily returning static data for the assignment.
// Later you can replace with Mongo queries.

app.get("/api/public/landing/featured", (req, res) => {
  const featuredInternships = [
    {
      id: "1",
      title: "UX Research Assistant — 3-Week Remote Internship",
      employer: "Nyancom Ltd.",
      location: "Remote (Bangladesh)",
      duration: "3 Weeks",
      budget: 4000,
      skills: ["User Research", "Survey Design", "Report Writing"],
      tags: ["ux", "remote"]
    },
    {
      id: "2",
      title: "Content Writer — Blog Posts",
      employer: "BrightPath Solutions",
      location: "Remote",
      duration: "1 Week",
      budget: 1500,
      skills: ["Content Writing"],
      tags: ["writing", "remote"]
    }
    
  ];

  res.json({
    success: true,
    data: featuredInternships
  });
});

app.get("/api/public/reviews", (req, res) => {
  const reviews = [
    {
      name: "Nafisa",
      role: "CSE Student",
      quote: "This platform helped me land my first paid project!"
    },
    {
      name: "Mr. Rahman",
      role: "HR Manager",
      quote: "We found skilled interns faster than before."
    },
    {
      name: "Sabbir",
      role: "Frontend Intern",
      quote: "The certificates look great on my portfolio."
    }
  ];

  res.json({
    success: true,
    data: reviews
  });
});


app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
