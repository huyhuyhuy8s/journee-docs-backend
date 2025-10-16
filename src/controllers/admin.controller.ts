import { Request, Response } from "express";
import { liveblocksService } from "../services/liveblocks.service";
import { clerkService } from "../services/clerk.service";
import { AuthRequest } from "../types";

class AdminController {
  async getSystemStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      // Get all rooms for stats
      const rooms = await liveblocksService.getRooms();

      const stats = {
        totalDocuments: rooms.data.length,
        totalActiveUsers: new Set(
          rooms.data.flatMap((room: any) =>
            Object.keys(room.usersAccesses || {})
          )
        ).size,
        documentsCreatedThisWeek: rooms.data.filter((room: any) => {
          const createdAt = new Date(room.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt >= weekAgo;
        }).length,
        documentsCreatedThisMonth: rooms.data.filter((room: any) => {
          const createdAt = new Date(room.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return createdAt >= monthAgo;
        }).length,
        averageCollaboratorsPerDocument:
          rooms.data.length > 0
            ? rooms.data.reduce(
                (sum: number, room: any) =>
                  sum + Object.keys(room.usersAccesses || {}).length,
                0
              ) / rooms.data.length
            : 0,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get system stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system stats",
      });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { page = "1", limit = "50", search = "" } = req.query;

      // Search users through Clerk
      const users = await clerkService.searchUsers(
        search as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          users,
          currentPage: parseInt(page as string),
          totalCount: users.length,
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get users",
      });
    }
  }

  async getAllDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { page = "1", limit = "50", search = "" } = req.query;

      // Get all rooms
      const rooms = await liveblocksService.getRooms();

      let filteredRooms = rooms.data;

      // Apply search filter
      if (search) {
        filteredRooms = filteredRooms.filter((room: any) =>
          room.metadata.title
            ?.toLowerCase()
            .includes((search as string).toLowerCase())
        );
      }

      // Apply pagination
      const startIndex =
        (parseInt(page as string) - 1) * parseInt(limit as string);
      const paginatedRooms = filteredRooms.slice(
        startIndex,
        startIndex + parseInt(limit as string)
      );

      const documents = paginatedRooms.map((room: any) => ({
        id: room.id,
        title: room.metadata.title || "Untitled Document",
        createdBy: room.metadata.createdBy || room.metadata.email,
        collaborators: Object.keys(room.usersAccesses || {}),
        createdAt: room.createdAt,
        lastActivity: room.lastConnectionAt,
      }));

      res.json({
        success: true,
        data: {
          documents,
          currentPage: parseInt(page as string),
          totalCount: filteredRooms.length,
          totalPages: Math.ceil(
            filteredRooms.length / parseInt(limit as string)
          ),
        },
      });
    } catch (error) {
      console.error("Get all documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get documents",
      });
    }
  }

  async forceDeleteDocument(req: AuthRequest, res: Response): Promise<void> {
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

      // Force delete room (admin action)
      await liveblocksService.deleteRoom(roomId);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Force delete document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete document",
      });
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { userId } = req.params;
      const { status } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
        });
        return;
      }

      // In a real implementation, you would update user status in your database
      // For now, we'll just return success
      res.json({
        success: true,
        data: {
          userId,
          status,
          updatedAt: new Date().toISOString(),
        },
        message: "User status updated successfully",
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user status",
      });
    }
  }
}

export const adminController = new AdminController();
