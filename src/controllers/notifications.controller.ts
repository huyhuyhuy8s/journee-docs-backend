import { Request, Response } from "express";
import { liveblocksService } from "../services/liveblocks.service";
import { AuthRequest } from "../types";

class NotificationsController {
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { page = "1", limit = "10" } = req.query;

      const notifications = await liveblocksService.getInboxNotifications(
        req.user.email,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        }
      );

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get notifications",
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Notification ID is required",
        });
        return;
      }

      await liveblocksService.markInboxNotificationAsRead(req.user.email, id);

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark notification as read",
      });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      await liveblocksService.markAllInboxNotificationsAsRead(req.user.email);

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark all notifications as read",
      });
    }
  }

  async deleteNotification(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Notification ID is required",
        });
        return;
      }

      await liveblocksService.deleteInboxNotification(req.user.email, id);

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete notification",
      });
    }
  }
}

export const notificationsController = new NotificationsController();
