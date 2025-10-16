import { Router } from "express";
import { activityController } from "../controllers/activity.controller";
import { authMiddleware } from "../middlewarer/auth.middleware";

const router = Router();

// All activity routes require authentication
router.use(authMiddleware);

// Activity tracking endpoints
router.get("/documents/:roomId", activityController.getDocumentActivity);
router.post("/documents/:roomId/presence", activityController.updatePresence);
router.get("/user/activity", activityController.getUserActivity);

export default router;
