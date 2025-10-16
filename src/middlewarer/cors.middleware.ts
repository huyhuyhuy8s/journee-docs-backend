import cors from "cors";
import { config } from "../../config/environment";

export const corsMiddleware = cors({
  origin: [
    config.frontendUrl,
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false, // Pass control to next handler
});
