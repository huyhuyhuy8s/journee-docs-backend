import { Router } from "express";
import { usersController } from "../controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /api/users/me - Get current user
router.get("/me", authMiddleware, usersController.getCurrentUser);

// GET /api/users/search - Search users
router.get("/search", authMiddleware, usersController.searchUsers);

// GET /api/users/:id - Get user by ID
router.get("/:id", authMiddleware, usersController.getUser);

// GET /api/users/email/:email - Get user by email
router.get("/email/:email", authMiddleware, usersController.getUserByEmail);

export default router;
