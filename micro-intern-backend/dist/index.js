"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const landingRoutes_1 = __importDefault(require("./routes/landingRoutes"));
const internshipRoutes_1 = __importDefault(require("./routes/internshipRoutes"));
const employerRoutes_1 = __importDefault(require("./routes/employerRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const courseShopRoutes_1 = __importDefault(require("./routes/courseShopRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const taskChatRoutes_1 = __importDefault(require("./routes/taskChatRoutes"));
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes"));
const anomalyRoutes_1 = __importDefault(require("./routes/anomalyRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const certificateRoutes_1 = __importDefault(require("./routes/certificateRoutes"));
const jobManagementRoutes_1 = __importDefault(require("./routes/jobManagementRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration - allow both localhost and production URLs
const allowedOrigins = [
    "http://localhost:5173", // Local development
    "http://localhost:3000", // Alternative local port
    process.env.FRONTEND_URL, // Production frontend URL from env
].filter(Boolean);
// For Vercel deployments, allow all origins (both frontend and backend are on Vercel)
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_URL;
// Log CORS configuration for debugging
console.log("🌐 CORS Configuration:");
console.log("  - Allowed origins:", allowedOrigins);
console.log("  - NODE_ENV:", process.env.NODE_ENV);
console.log("  - VERCEL:", process.env.VERCEL);
console.log("  - VERCEL_URL:", process.env.VERCEL_URL);
console.log("  - Is Vercel deployment:", isVercel);
app.use((0, cors_1.default)({
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
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// simple test route
app.get("/", (_req, res) => {
    res.send("Micro-Internship API is running");
});
// 🔴 IMP
app.use("/api/auth", authRoutes_1.default);
// Public routes (Feature-01)
app.use("/api/public", landingRoutes_1.default);
// Internship routes (Feature-02)
app.use("/api/internships", internshipRoutes_1.default);
app.use("/api/employer", employerRoutes_1.default);
app.use("/api/student", studentRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/applications", applicationRoutes_1.default);
app.use("/api/shop", courseShopRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/task-chat", taskChatRoutes_1.default);
app.use("/api/leaderboard", leaderboardRoutes_1.default);
app.use("/api/anomalies", anomalyRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/certificates", certificateRoutes_1.default);
app.use("/api/jobs", jobManagementRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/upload", uploadRoutes_1.default);
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
            w: 'majority',
            // For serverless environments like Vercel
            bufferCommands: false,
            bufferMaxEntries: 0,
        };
        console.log("🔄 Attempting to connect to MongoDB...");
        console.log(`📍 Connection string: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials in logs
        await mongoose_1.default.connect(mongoUri, options);
        console.log("✅ MongoDB connected successfully");
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            console.error("❌ MongoDB connection error:", err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log("✅ MongoDB reconnected");
        });
    }
    catch (err) {
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
        }
        else if (err.message.includes('authentication') || err.code === 8000) {
            console.error("\n💡 Authentication failed:");
            console.error("1. Check your MongoDB username and password in connection string");
            console.error("2. Ensure the database user has proper permissions");
            console.error("3. Verify connection string format: mongodb+srv://username:password@cluster.mongodb.net/dbname");
        }
        else if (err.message.includes('buffering timed out') || err.message.includes('server selection timed out')) {
            console.error("\n💡 Connection timeout:");
            console.error("1. Check your internet connection");
            console.error("2. Verify MongoDB Atlas cluster is accessible");
            console.error("3. Check firewall settings");
            console.error("4. For Vercel: Ensure IP whitelist includes 0.0.0.0/0");
        }
        else if (err.message.includes('IP')) {
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
}
else {
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
exports.default = app;
// Only listen if running locally (not on Vercel)
if (process.env.VERCEL !== "1") {
    app.listen(PORT, () => {
        console.log(`API server listening on port ${PORT}`);
    });
}
