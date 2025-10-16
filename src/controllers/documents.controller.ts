import { Request, Response } from "express";
import { documentService } from "../services/document.service";
import { liveblocksService } from "../services/liveblocks.service";
import { AuthRequest, ApiResponse } from "../types";

class DocumentsController {
  async createDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { title = "Untitled Document" } = req.body;

      console.log("Creating document for user:", req.user.id);

      // Create document in database (if you have one)
      const document = await documentService.createDocument({
        title,
        createdBy: req.user.id,
        collaborators: [req.user.id], // Include creator as collaborator
      });

      // Create Liveblocks room with proper access
      try {
        await liveblocksService.createRoom(document.roomId, req.user.id, {
          title,
          documentId: document.id,
        });
      } catch (roomError) {
        console.error("Failed to create Liveblocks room:", roomError);
        // Continue anyway - room might already exist
      }

      console.log("Document created successfully:", document.id);

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create document",
      });
    }
  }

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
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
      } = req.query;

      const documents = await documentService.getDocuments({
        userId: req.user.id,
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder) as "asc" | "desc",
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch documents",
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
      console.log("Getting document:", id, "for user:", req.user.id);

      const document = await documentService.getDocument(id, req.user.id);

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Ensure user has access to the Liveblocks room
      try {
        await liveblocksService.updateRoomAccess(document.roomId, req.user.id, [
          "room:write",
        ]);
      } catch (roomError) {
        console.error("Failed to update room access:", roomError);
        // Continue anyway
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch document",
      });
    }
  }

  async updateDocument(
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

      const document = await (documentService as any).updateDocument(
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

  async deleteDocument(
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

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
        return;
      }

      // use a type assertion to call the deletion method if it's implemented
      await (documentService as any).deleteDocument(id, req.user.id);

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
