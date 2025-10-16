import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin endpoints
router.get("/stats", adminController.getSystemStats);
router.get("/users", adminController.getAllUsers);
router.get("/documents", adminController.getAllDocuments);
router.delete("/documents/:roomId", adminController.forceDeleteDocument);
router.patch("/users/:userId/status", adminController.updateUserStatus);

export default router;
