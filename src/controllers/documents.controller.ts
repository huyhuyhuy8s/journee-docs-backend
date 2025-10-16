import { Request, Response } from "express";
import { documentService } from "../services/document.service";
import { AuthRequest, ApiResponse } from "../types";

class DocumentsController {
  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const {
        page = "1",
        limit = "10",
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };

      const result = await documentService.getDocuments(req.user.id, options);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get documents",
      });
    }
  }

  async getDocument(req: AuthRequest, res: Response): Promise<void> {
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
          error: "Document ID is required",
        });
        return;
      }

      const document = await documentService.getDocument(id, req.user.id);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Get document error:", error);

      if (error instanceof Error) {
        if (error.message === "Access denied") {
          res.status(403).json({
            success: false,
            error: "Access denied to this document",
          });
          return;
        }

        if (error.message === "Room not found") {
          res.status(404).json({
            success: false,
            error: "Document not found",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to get document",
      });
    }
  }

  async createDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { title } = req.body;

      if (!title || typeof title !== "string") {
        res.status(400).json({
          success: false,
          error: "Document title is required",
        });
        return;
      }

      const document = await documentService.createDocument({
        title: title.trim(),
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: document,
        message: "Document created successfully",
      });
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create document",
      });
    }
  }

  async updateDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { title, collaborators } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
        return;
      }

      const updates: any = {};

      if (title) {
        updates.title = title.trim();
      }

      if (collaborators && Array.isArray(collaborators)) {
        updates.collaborators = collaborators;
      }

      const document = await documentService.updateDocument(
        id,
        req.user.id,
        updates
      );

      res.json({
        success: true,
        data: document,
        message: "Document updated successfully",
      });
    } catch (error) {
      console.error("Update document error:", error);

      if (error instanceof Error) {
        if (error.message === "Write access denied") {
          res.status(403).json({
            success: false,
            error: "You do not have permission to edit this document",
          });
          return;
        }

        if (error.message === "Room not found") {
          res.status(404).json({
            success: false,
            error: "Document not found",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to update document",
      });
    }
  }

  async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
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
          error: "Document ID is required",
        });
        return;
      }

      await documentService.deleteDocument(id, req.user.id);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Delete document error:", error);

      if (error instanceof Error) {
        if (error.message === "Only document creator can delete") {
          res.status(403).json({
            success: false,
            error: "Only the document creator can delete this document",
          });
          return;
        }

        if (error.message === "Room not found") {
          res.status(404).json({
            success: false,
            error: "Document not found",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete document",
      });
    }
  }
}

export const documentsController = new DocumentsController();
