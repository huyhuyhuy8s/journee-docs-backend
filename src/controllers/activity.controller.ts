import { Request, Response } from "express";
import { liveblocksService } from "../services/liveblocks.service";
import { AuthRequest } from "../types";

class ActivityController {
  async getDocumentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { roomId } = req.params;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: "Room ID is required",
        });
        return;
      }

      // Check if user has access to the room
      const room = await liveblocksService.getRoom(roomId);
      const hasAccess = room.usersAccesses?.[req.user.email] || room.metadata.createdBy === req.user.email;

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: "Access denied to this document",
        });
        return;
      }

      // Get room activity/presence data
      const activity = {
        roomId,
        activeUsers: Object.keys(room.usersAccesses || {}),
        lastActivity: room.lastConnectionAt || room.createdAt,
        totalCollaborators: Object.keys(room.usersAccesses || {}).length,
      };

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      console.error("Get document activity error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get document activity",
      });
    }
  }

  async updatePresence(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { roomId } = req.params;
      const { cursor, selection, lastActiveAt } = req.body;

      if (!roomId) {
        res.status(400).json({
          success: false,
          error: "Room ID is required",
        });
        return;
      }

      // In a real implementation, you would update user presence in Liveblocks
      // For now, we'll just acknowledge the presence update
      const presenceUpdate = {
        userId: req.user.email,
        roomId,
        cursor,
        selection,
        lastActiveAt: lastActiveAt || new Date().toISOString(),
      };

      res.json({
        success: true,
        data: presenceUpdate,
        message: "Presence updated successfully",
      });
    } catch (error) {
      console.error("Update presence error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update presence",
      });
    }
  }

  async getUserActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { limit = "10", days = "7" } = req.query;

      // Get user's recent rooms activity
      const rooms = await liveblocksService.getRooms(req.user.email);
      
      // Filter and sort by recent activity
      const recentActivity = rooms.data
        .filter((room: any) => {
          const lastActivity = new Date(room.lastConnectionAt || room.createdAt);
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
          return lastActivity >= daysAgo;
        })
        .sort((a: any, b: any) => {
          const aTime = new Date(a.lastConnectionAt || a.createdAt).getTime();
          const bTime = new Date(b.lastConnectionAt || b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, parseInt(limit as string))
        .map((room: any) => ({
          roomId: room.id,
          title: room.metadata.title || "Untitled Document",
          lastActivity: room.lastConnectionAt || room.createdAt,
          role: room.metadata.createdBy === req.user?.email ? "creator" : "collaborator",
        }));

      res.json({
        success: true,
        data: {
          recentActivity,
          totalDocuments: rooms.data.length,
        },
      });
    } catch (error) {
      console.error("Get user activity error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user activity",
      });
    }
  }
}

export const activityController = new ActivityController();
