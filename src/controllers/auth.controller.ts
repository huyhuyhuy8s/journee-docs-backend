import { Request, Response } from "express";
import { liveblocksService } from "../services/liveblocks.service";
import { clerkService } from "../services/clerk.service";
import { AuthRequest, ApiResponse } from "../types";

class AuthController {
  async liveblocksAuth(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      console.log("Liveblocks auth for user:", req.user.id);

      const { status, body } = await liveblocksService.identifyUser(req.user);

      res.status(status).json({
        success: true,
        data: body,
      });
    } catch (error) {
      console.error("Liveblocks auth error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to authenticate with Liveblocks",
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get current user",
      });
    }
  }

  async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, limit = 10 } = req.query;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          success: false,
          error: "Query parameter is required",
        });
        return;
      }

      const users = await clerkService.searchUsers(query, Number(limit));

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to search users",
      });
    }
  }
}

export const authController = new AuthController();
