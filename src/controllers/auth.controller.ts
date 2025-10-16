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

      const { status, body } = await liveblocksService.identifyUser(req.user);

      // Parse the body string to get the token
      const responseData = JSON.parse(body);

      // Return the response in the format Liveblocks expects
      res.status(status).json(responseData);
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

  async verifyToken(req: AuthRequest, res: Response): Promise<void> {
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
        data: {
          valid: true,
          user: req.user,
        },
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify token",
      });
    }
  }

  async searchUsers(req: AuthRequest & Request, res: Response): Promise<void> {
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
