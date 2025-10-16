import { Request, Response } from "express";
import crypto from "crypto";
import { config } from "../../config/environment";

class WebhooksController {
  async handleLiveblocksWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const signature = req.headers['liveblocks-signature'] as string;

      // Verify webhook signature (if configured)
      if (config.liveblocksWebhookSecret && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', config.liveblocksWebhookSecret)
          .update(body)
          .digest('hex');

        if (signature !== expectedSignature) {
          res.status(401).json({
            success: false,
            error: "Invalid webhook signature",
          });
          return;
        }
      }

      const event = JSON.parse(body.toString());

      console.log("Received Liveblocks webhook:", event.type);

      switch (event.type) {
        case 'roomCreated':
          console.log("Room created:", event.data.roomId);
          break;
        case 'roomDeleted':
          console.log("Room deleted:", event.data.roomId);
          break;
        case 'userEntered':
          console.log("User entered room:", event.data.userId, event.data.roomId);
          break;
        case 'userLeft':
          console.log("User left room:", event.data.userId, event.data.roomId);
          break;
        default:
          console.log("Unknown webhook event:", event.type);
      }

      res.json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      console.error("Liveblocks webhook error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process webhook",
      });
    }
  }

  async handleClerkWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const signature = req.headers['svix-signature'] as string;

      // Verify Clerk webhook signature (if configured)
      if (config.clerkWebhookSecret && signature) {
        // Implement Clerk webhook signature verification
        // This is a simplified version - in production, use Clerk's webhook verification
      }

      const event = JSON.parse(body.toString());

      console.log("Received Clerk webhook:", event.type);

      switch (event.type) {
        case 'user.created':
          console.log("User created:", event.data.id);
          // Handle new user creation
          break;
        case 'user.updated':
          console.log("User updated:", event.data.id);
          // Handle user profile updates
          break;
        case 'user.deleted':
          console.log("User deleted:", event.data.id);
          // Handle user deletion
          break;
        default:
          console.log("Unknown Clerk webhook event:", event.type);
      }

      res.json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      console.error("Clerk webhook error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process webhook",
      });
    }
  }
}

export const webhooksController = new WebhooksController();
