import { Router } from "express";
import { notificationsController } from "../controllers/notifications.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// Notification endpoints
router.get("/", notificationsController.getNotifications);
router.post("/mark-read/:id", notificationsController.markAsRead);
router.post("/mark-all-read", notificationsController.markAllAsRead);
router.delete("/:id", notificationsController.deleteNotification);

export default router;
