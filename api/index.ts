// Vercel serverless function - Entry point for all API routes
import app from "../micro-intern-backend/src/index";

// Export the Express app - Vercel will use it as a serverless function
export default app;
