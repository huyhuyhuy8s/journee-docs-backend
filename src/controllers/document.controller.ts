import { Response } from "express";
import { documentService } from "../services/document.service";
import { liveblocksService } from "../services/liveblocks.service";
import { userService } from "../services/user.service";
import { AuthRequest, ApiResponse } from "../types";

class DocumentController {
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
        console.log("❌ No authenticated user in request");
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      console.log("📄 DocumentController.getDocuments - User:", req.user.id);
      console.log("📄 Query params:", req.query);

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
      } = req.query;

      const params = {
        userId: req.user.id,
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        sortBy: String(sortBy),
        sortOrder: String(sortOrder) as "asc" | "desc",
        dateFrom: dateFrom ? String(dateFrom) : undefined,
        dateTo: dateTo ? String(dateTo) : undefined,
      };

      console.log("📄 Calling documentService.getDocuments with:", params);

      const documents = await documentService.getDocuments(params);

      console.log("📄 DocumentService returned:", {
        totalCount: documents.totalCount,
        dataLength: documents.data.length,
        currentPage: documents.currentPage,
      });

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      console.error("❌ Get documents error:", error);
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

  async getDocumentByRoomId(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { roomId } = req.params;
      console.log(
        "🔍 Getting document by room ID:",
        roomId,
        "for user:",
        req.user.id
      );

      const document = await documentService.getDocumentByRoomId(
        roomId,
        req.user.id
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      console.log("✅ Document found by room ID:", document.title);

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Get document by room ID error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch document",
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
      const updates = req.body;

      console.log("Updating document:", id, "with:", updates);

      const document = await documentService.updateDocument(
        id,
        req.user.id,
        updates
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Update Liveblocks room metadata if title changed
      if (updates.title) {
        try {
          await liveblocksService.updateRoomMetadata(document.roomId, {
            title: updates.title,
            documentId: document.id,
          });
        } catch (roomError) {
          console.error("Failed to update Liveblocks room metadata:", roomError);
          // Continue anyway
        }
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Update document error:", error);
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
      console.log("Deleting document:", id, "by user:", req.user.id);

      // Get document first to get room ID
      const document = await documentService.getDocument(id, req.user.id);

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Delete from document service
      const deleted = await documentService.deleteDocument(id, req.user.id);

      if (!deleted) {
        res.status(500).json({
          success: false,
          error: "Failed to delete document",
        });
        return;
      }

      // Delete Liveblocks room
      try {
        await liveblocksService.deleteRoom(document.roomId);
      } catch (roomError) {
        console.error("Failed to delete Liveblocks room:", roomError);
        // Continue anyway - document is deleted
      }

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete document",
      });
    }
  }

  async addCollaborator(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const { email, access = ["room:write"] } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: "Email is required",
        });
        return;
      }

      console.log("👥 Adding collaborator by email:", email, "to document:", id);

      // Look up user by email
      const collaboratorUser = await userService.getUserByEmail(email);

      if (!collaboratorUser) {
        res.status(404).json({
          success: false,
          error: "User not found with this email address",
        });
        return;
      }

      const document = await documentService.addCollaborator(
        id,
        req.user.id,
        collaboratorUser.id
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Add collaborator to Liveblocks room
      try {
        await liveblocksService.addCollaborator(
          document.roomId,
          collaboratorUser.id,
          access
        );
      } catch (roomError) {
        console.error("Failed to add collaborator to Liveblocks room:", roomError);
        // Continue anyway
      }

      res.json({
        success: true,
        data: {
          document,
          collaborator: collaboratorUser,
        },
      });
    } catch (error) {
      console.error("Add collaborator error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add collaborator",
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

      const { id, userId: collaboratorId } = req.params;

      console.log("👥 Removing collaborator:", collaboratorId, "from document:", id);

      const document = await documentService.removeCollaborator(
        id,
        req.user.id,
        collaboratorId
      );

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Remove collaborator from Liveblocks room
      try {
        await liveblocksService.removeCollaborator(
          document.roomId,
          collaboratorId
        );
      } catch (roomError) {
        console.error("Failed to remove collaborator from Liveblocks room:", roomError);
        // Continue anyway
      }

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("Remove collaborator error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove collaborator",
      });
    }
  }

  // Add method to get document collaborators with full user info
  async getDocumentCollaborators(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const document = await documentService.getDocument(id, req.user.id);

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found",
        });
        return;
      }

      // Get full user info for all collaborators
      const collaborators = await Promise.all(
        document.collaborators.map(async (userId) => {
          const user = await userService.getUserById(userId);
          return (
            user || {
              id: userId,
              email: "Unknown",
              name: "Unknown User",
              avatar: undefined,
              color: "#gray",
            }
          );
        })
      );

      res.json({
        success: true,
        data: collaborators,
      });
    } catch (error) {
      console.error("Get collaborators error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get collaborators",
      });
    }
  }

  // Add this method to the DocumentController class:
  async updateDocumentTitle(req: AuthRequest, res: Response): Promise<void> {
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

      if (!title || typeof title !== "string") {
        res.status(400).json({
          success: false,
          error: "Title is required and must be a string",
        });
        return;
      }

      console.log(
        "📝 Updating document title:",
        id,
        "to:",
        title,
        "by user:",
        req.user.id
      );

      const document = await documentService.updateDocument(id, req.user.id, {
        title,
      });

      if (!document) {
        res.status(404).json({
          success: false,
          error: "Document not found or access denied",
        });
        return;
      }

      // Also update Liveblocks room metadata
      try {
        await liveblocksService.updateRoomMetadata(document.roomId, {
          title,
          documentId: document.id,
          creatorId: document.createdBy,
        });
        console.log("✅ Liveblocks metadata updated");
      } catch (roomError) {
        console.error("⚠️ Failed to update Liveblocks metadata:", roomError);
        // Continue anyway - backend is updated
      }

      console.log("✅ Document title updated successfully");

      res.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error("❌ Update document title error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update document title",
      });
    }
  }
}

export const documentController = new DocumentController();
