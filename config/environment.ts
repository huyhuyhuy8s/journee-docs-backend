import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database (optional for now)
  mongoUri: process.env.MONGODB_URI, // No default value - will be undefined if not set

  // Clerk
  clerkSecretKey: process.env.CLERK_SECRET_KEY!,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY!,

  // Liveblocks
  liveblocksSecretKey: process.env.LIVEBLOCKS_SECRET_KEY!,

  // Cloudinary (optional)
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Validate required environment variables
const requiredEnvVars = ["CLERK_SECRET_KEY", "LIVEBLOCKS_SECRET_KEY"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log("✅ Environment configuration loaded");
console.log(`📦 Environment: ${config.nodeEnv}`);
console.log(`🔌 Port: ${config.port}`);
console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
console.log(
  `🗄️  Database: ${
    config.mongoUri ? "Configured" : "Not configured (using mock data)"
  }`
);
