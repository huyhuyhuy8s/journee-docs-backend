import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/journee-docs",

  // Clerk
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  clerkSecretKey: process.env.CLERK_SECRET_KEY!,
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,

  // Liveblocks
  liveblocksSecretKey: process.env.LIVEBLOCKS_SECRET_KEY!,
  liveblocksWebhookSecret: process.env.LIVEBLOCKS_WEBHOOK_SECRET,

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-jwt-secret",
};

// Validate required environment variables
const requiredEnvVars = [
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "LIVEBLOCKS_SECRET_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
