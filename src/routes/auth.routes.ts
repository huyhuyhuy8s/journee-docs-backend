import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// Liveblocks authentication endpoint
router.post("/liveblocks", authMiddleware, authController.liveblocksAuth);

// Verify token endpoint
router.get("/verify", authMiddleware, authController.verifyToken);

// Get current user endpoint
router.get("/me", authMiddleware, authController.getCurrentUser);

export default router;