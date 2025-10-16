import { Router, Request, Response } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import documentRoutes from "./documents.routes"; // Make sure this matches your file name
import uploadRoutes from "./upload.routes";
import userRoutes from "./users.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Journee Docs API is running!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

// API routes
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/upload", uploadRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// 404 handler for API routes
router.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found",
    path: req.originalUrl,
  });
});

export default router;
