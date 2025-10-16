import { Router } from "express";
import { usersController } from "../controllers/users.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// User operations
router.get("/search", usersController.searchUsers);
router.get("/:id", usersController.getUser);

export default router;
