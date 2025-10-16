import cors from "cors";
import { config } from "../../config/environment";

export const corsMiddleware = cors({
  origin: [
    config.frontendUrl,
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
