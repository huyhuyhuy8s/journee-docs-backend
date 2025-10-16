import { Request, Response } from "express";
import { clerkService } from "../services/clerk.service";
import { AuthRequest } from "../types";

class UsersController {
  async getUser(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
        });
        return;
      }

      const user = await clerkService.getUser(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user",
      });
    }
  }

  async getUserByEmail(
    req: Request & AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          error: "Email is required",
        });
        return;
      }

      const user = await clerkService.getUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user by email error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user",
      });
    }
  }

  async searchUsers(req: Request & AuthRequest, res: Response): Promise<void> {
    try {
      const { q: query, limit = "10" } = req.query;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          success: false,
          error: "Query parameter is required",
        });
        return;
      }

      const users = await clerkService.searchUsers(
        query,
        parseInt(limit as string)
      );

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

  async getCurrentUser(
    req: Request & AuthRequest,
    res: Response
  ): Promise<void> {
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
}

export const usersController = new UsersController();
