import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { config } from "../config/environment";
import { corsMiddleware } from "./middlewarer/cors.middleware";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌍 === INCOMING REQUEST ===`);
  console.log(`🌍 ${req.method} ${req.url}`);
  console.log(`🌍 Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🌍 Query:`, req.query);
  console.log(`🌍 Body:`, req.body);
  console.log(`🌍 ========================`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Journee Docs Backend API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);

    res.status(err.status || 500).json({
      success: false,
      error:
        config.nodeEnv === "production" ? "Internal server error" : err.message,
      ...(config.nodeEnv === "development" && { stack: err.stack }),
    });
  }
);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS enabled for: ${config.frontendUrl}`);
});

export default app;
