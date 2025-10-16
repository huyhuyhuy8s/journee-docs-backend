import { Router } from "express";
import { webhooksController } from "../controllers/webhooks.controller";
import express from "express";

const router = Router();

// Webhook endpoints (no auth middleware for external webhooks)
router.post("/liveblocks", express.raw({ type: 'application/json' }), webhooksController.handleLiveblocksWebhook);
router.post("/clerk", express.raw({ type: 'application/json' }), webhooksController.handleClerkWebhook);

export default router;
