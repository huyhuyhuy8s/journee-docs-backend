import { Router } from "express";
import authRoutes from "./auth.routes";
import documentsRoutes from "./documents.routes";
import usersRoutes from "./users.routes";
import uploadRoutes from "./upload.routes";
import notificationsRoutes from "./notifications.routes";
import activityRoutes from "./activity.routes";
import adminRoutes from "./admin.routes";
import webhooksRoutes from "./webhooks.routes";

const router = Router();

// Mount routes
router.use("/auth", authRoutes);
router.use("/documents", documentsRoutes);
router.use("/users", usersRoutes);
router.use("/upload", uploadRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/activity", activityRoutes);
router.use("/admin", adminRoutes);
router.use("/webhooks", webhooksRoutes);

export default router;