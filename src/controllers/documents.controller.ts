import { Request, Response } from "express";
import { documentService } from "../services/document.service";
import { AuthRequest, ApiResponse } from "../types";

class DocumentsController {
  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log("🚀 === DOCUMENTS CONTROLLER - getDocuments CALLED ===");
      console.log("🚀 Request URL:", req.url);
      console.log("🚀 Request method:", req.method);
      console.log("🚀 Request headers:", req.headers);
      console.log("Documents controller - getDocuments called");
      console.log("Documents controller - User:", req.user);
      console.log("Documents controller - Query params:", req.query);

      if (!req.user) {
        console.log("Documents controller - No user found");
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

      console.log("Documents controller - Options:", options);
      console.log(
        "Documents controller - Calling documentService.getDocuments..."
      );

      const result = await documentService.getDocuments(req.user.id, options);

      console.log("Documents controller - Result:", result);

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

  async inviteCollaborator(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { email, permission = "room:write" } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
        return;
      }

      if (!email) {
        res.status(400).json({
          success: false,
          error: "Email is required",
        });
        return;
      }

      const result = await documentService.inviteCollaborator(
        id,
        req.user.id,
        email,
        permission
      );

      res.json({
        success: true,
        data: result,
        message: "Collaborator invited successfully",
      });
    } catch (error) {
      console.error("Invite collaborator error:", error);

      if (error instanceof Error) {
        if (error.message === "User not found") {
          res.status(404).json({
            success: false,
            error: "User with this email was not found",
          });
          return;
        }

        if (error.message === "Access denied") {
          res.status(403).json({
            success: false,
            error: "You do not have permission to invite collaborators",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to invite collaborator",
      });
    }
  }

  async removeCollaborator(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id, userId } = req.params;

      if (!id || !userId) {
        res.status(400).json({
          success: false,
          error: "Document ID and User ID are required",
        });
        return;
      }

      await documentService.removeCollaborator(id, req.user.id, userId);

      res.json({
        success: true,
        message: "Collaborator removed successfully",
      });
    } catch (error) {
      console.error("Remove collaborator error:", error);

      if (error instanceof Error) {
        if (error.message === "Access denied") {
          res.status(403).json({
            success: false,
            error: "You do not have permission to remove collaborators",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to remove collaborator",
      });
    }
  }

  async renameDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { title } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
        return;
      }

      if (!title || typeof title !== "string") {
        res.status(400).json({
          success: false,
          error: "Document title is required",
        });
        return;
      }

      const document = await documentService.updateDocument(id, req.user.id, {
        title: title.trim(),
      });

      res.json({
        success: true,
        data: document,
        message: "Document renamed successfully",
      });
    } catch (error) {
      console.error("Rename document error:", error);

      if (error instanceof Error) {
        if (error.message === "Write access denied") {
          res.status(403).json({
            success: false,
            error: "You do not have permission to rename this document",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to rename document",
      });
    }
  }

  async getDocumentAccess(req: AuthRequest, res: Response): Promise<void> {
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

      const access = await documentService.getDocumentAccess(id, req.user.id);

      res.json({
        success: true,
        data: access,
      });
    } catch (error) {
      console.error("Get document access error:", error);

      if (error instanceof Error) {
        if (error.message === "Access denied") {
          res.status(403).json({
            success: false,
            error: "Access denied to this document",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to get document access",
      });
    }
  }

  async updateDocumentAccess(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { usersAccesses } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: "Document ID is required",
        });
        return;
      }

      const access = await documentService.updateDocumentAccess(
        id,
        req.user.id,
        usersAccesses
      );

      res.json({
        success: true,
        data: access,
        message: "Document access updated successfully",
      });
    } catch (error) {
      console.error("Update document access error:", error);

      if (error instanceof Error) {
        if (error.message === "Access denied") {
          res.status(403).json({
            success: false,
            error: "You do not have permission to update document access",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to update document access",
      });
    }
  }
}

export const documentsController = new DocumentsController();
