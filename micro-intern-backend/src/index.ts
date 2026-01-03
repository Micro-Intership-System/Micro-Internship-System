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

// CORS configuration - allow both localhost and production URLs
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "http://localhost:3000", // Alternative local port
  process.env.FRONTEND_URL, // Production frontend URL from env
].filter(Boolean) as string[];

// For Vercel deployments, allow all origins (both frontend and backend are on Vercel)
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_URL;

// Log CORS configuration for debugging
console.log("🌐 CORS Configuration:");
console.log("  - Allowed origins:", allowedOrigins);
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - VERCEL:", process.env.VERCEL);
console.log("  - VERCEL_URL:", process.env.VERCEL_URL);
console.log("  - Is Vercel deployment:", isVercel);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // On Vercel, allow all origins (frontend and backend are on same platform)
      if (isVercel) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      
      // Allow all Vercel deployments (check origin string)
      if (origin.includes(".vercel.app") || origin.includes("vercel.app")) {
        callback(null, true);
        return;
      }
      
      // In development, allow all origins
      if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
        callback(null, true);
        return;
      }
      
      // In production (non-Vercel), log and reject
      console.warn(`❌ CORS: Rejected origin: ${origin}`);
      console.warn(`   Allowed origins: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    },
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


const PORT = process.env.PORT || 1547;

// MongoDB connection with improved error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in environment variables");
      console.error("Please create a .env file with MONGO_URI=your_connection_string");
      process.exit(1);
    }

    const mongoUri = process.env.MONGO_URI.trim();
    
    // Validate connection string format
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB connection string format. Must start with mongodb:// or mongodb+srv://');
    }
    
    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds (increased for Vercel)
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds (increased for Vercel)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Reduced for serverless (Vercel)
      retryWrites: true,
      w: 'majority' as const,
      // For serverless environments like Vercel
      bufferCommands: false,
      bufferMaxEntries: 0,
    };

    console.log("🔄 Attempting to connect to MongoDB...");
    console.log(`📍 Connection string: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials in logs
    
    await mongoose.connect(mongoUri, options);
    
    console.log("✅ MongoDB connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log("✅ MongoDB reconnected");
    });
    
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:");
    console.error("Error:", err.message);
    console.error("Error code:", err.code);
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error("\n💡 Troubleshooting tips:");
      console.error("1. Check if your MongoDB Atlas cluster is running (not paused)");
      console.error("2. Verify your connection string is correct");
      console.error("3. Check your network connection");
      console.error("4. Ensure your IP address is whitelisted in MongoDB Atlas");
      console.error("   - For Vercel: Add 0.0.0.0/0 to allow all IPs (or specific Vercel IPs)");
      console.error("5. If using SRV connection string, ensure DNS resolution works");
    } else if (err.message.includes('authentication') || err.code === 8000) {
      console.error("\n💡 Authentication failed:");
      console.error("1. Check your MongoDB username and password in connection string");
      console.error("2. Ensure the database user has proper permissions");
      console.error("3. Verify connection string format: mongodb+srv://username:password@cluster.mongodb.net/dbname");
    } else if (err.message.includes('buffering timed out') || err.message.includes('server selection timed out')) {
      console.error("\n💡 Connection timeout:");
      console.error("1. Check your internet connection");
      console.error("2. Verify MongoDB Atlas cluster is accessible");
      console.error("3. Check firewall settings");
      console.error("4. For Vercel: Ensure IP whitelist includes 0.0.0.0/0");
    } else if (err.message.includes('IP')) {
      console.error("\n💡 IP Whitelist Issue:");
      console.error("1. Go to MongoDB Atlas → Network Access");
      console.error("2. Add IP Address: 0.0.0.0/0 (allows all IPs)");
      console.error("3. Wait 1-2 minutes for changes to propagate");
    }
    
    // Don't exit - let the server start but operations will fail
    // This allows the server to run and show better error messages
    // In serverless, we'll retry on first request
    console.error("\n⚠️ Server will continue running, but database operations will fail.");
    console.error("⚠️ Connection will be retried on first database operation.");
  }
};

// Connect to MongoDB (non-blocking for serverless)
// In serverless environments, connection is established on first request
if (process.env.VERCEL !== "1") {
  // Only connect immediately if not on Vercel (local development)
  connectDB();
} else {
  // On Vercel, connect on first request to avoid cold start issues
  // But still attempt connection in background
  connectDB().catch((err) => {
    console.warn("⚠️ Initial MongoDB connection failed, will retry on first request:", err.message);
  });
}

// Email verification is now lazy - only verifies when first email is sent
// This prevents connection timeouts during server startup


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


// Export for Vercel serverless functions
export default app;

// Only listen if running locally (not on Vercel)
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}
