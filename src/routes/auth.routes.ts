import { Router } from "express";
import { authController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/liveblocks - Authenticate with Liveblocks
router.post("/liveblocks", authMiddleware, authController.liveblocksAuth);

// GET /api/auth/me - Get current user
router.get("/me", authMiddleware, authController.getCurrentUser);

// GET /api/auth/users/search - Search users
router.get("/users/search", authMiddleware, authController.searchUsers);

export default router;
