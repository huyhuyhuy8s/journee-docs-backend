import { liveblocksService } from "./liveblocks.service";
import { clerkService } from "./clerk.service";
import { Document, User } from "../types";

interface CreateDocumentData {
  title: string;
  userId: string;
}

interface UpdateDocumentData {
  title?: string;
  collaborators?: string[];
}

interface GetDocumentsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

class DocumentService {
  async createDocument(data: CreateDocumentData): Promise<Document> {
    try {
      const { title, userId } = data;
      const roomId = this.generateRoomId();

      // Create room in Liveblocks
      const room = await liveblocksService.createRoom(roomId, userId, {
        title,
        createdAt: new Date().toISOString(),
      });

      const document: Document = {
        id: room.id,
        title,
        roomId: room.id,
        createdBy: userId,
        collaborators: [],
        createdAt: this.parseDate(room.metadata.createdAt),
        updatedAt: new Date(),
      };

      return document;
    } catch (error) {
      console.error("Document service create error:", error);
      throw new Error("Failed to create document");
    }
  }

  async getDocument(roomId: string, userId: string): Promise<Document> {
    try {
      const room = await liveblocksService.getRoom(roomId);

      // Check if user has access
      const hasAccess = this.checkUserAccess(room, userId);
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      return {
        id: room.id,
        title: Array.isArray(room.metadata.title)
          ? room.metadata.title[0]
          : room.metadata.title || "Untitled Document",
        roomId: room.id,
        createdBy: Array.isArray(room.metadata.createdBy)
          ? room.metadata.createdBy[0]
          : room.metadata.createdBy || "Unknown",
        collaborators: Object.keys(room.usersAccesses || {}).filter(
          (id) => id !== room.metadata.createdBy
        ),
        createdAt: this.parseDate(room.metadata.createdAt),
        updatedAt: this.parseDate(
          room.lastConnectionAt || room.metadata.createdAt
        ),
      };
    } catch (error) {
      console.error("Document service get error:", error);
      throw new Error("Failed to get document");
    }
  }

  async updateDocument(
    roomId: string,
    userId: string,
    updates: UpdateDocumentData
  ): Promise<Document> {
    try {
      const room = await liveblocksService.getRoom(roomId);

      // Check if user has write access
      const hasWriteAccess = this.checkUserWriteAccess(room, userId);
      if (!hasWriteAccess) {
        throw new Error("Write access denied");
      }

      const updateData: any = {
        metadata: {
          ...room.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      if (updates.title) {
        updateData.metadata.title = updates.title;
      }

      if (updates.collaborators) {
        const usersAccesses: any = {
          [Array.isArray(room.metadata.createdBy)
            ? room.metadata.createdBy[0]
            : room.metadata.createdBy || "Unknown"]: ["room:write"],
        };

        for (const collaboratorEmail of updates.collaborators) {
          usersAccesses[collaboratorEmail] = ["room:write"];
        }

        updateData.usersAccesses = usersAccesses;
      }

      const updatedRoom = await liveblocksService.updateRoom(
        roomId,
        updateData
      );

      return {
        id: updatedRoom.id,
        title: Array.isArray(updatedRoom.metadata.title)
          ? updatedRoom.metadata.title[0]
          : updatedRoom.metadata.title || "Untitled Document",
        roomId: updatedRoom.id,
        createdBy: Array.isArray(updatedRoom.metadata.createdBy)
          ? updatedRoom.metadata.createdBy[0]
          : updatedRoom.metadata.createdBy || "Unknown",
        collaborators: Object.keys(updatedRoom.usersAccesses || {}).filter(
          (id) => id !== updatedRoom.metadata.createdBy
        ),
        createdAt: this.parseDate(updatedRoom.metadata.createdAt),
        updatedAt: this.parseDate(updatedRoom.metadata.updatedAt),
      };
    } catch (error) {
      console.error("Document service update error:", error);
      throw new Error("Failed to update document");
    }
  }

  async deleteDocument(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await liveblocksService.getRoom(roomId);

      // Only creator can delete
      if (room.metadata.createdBy !== userId) {
        throw new Error("Only document creator can delete");
      }

      await liveblocksService.deleteRoom(roomId);
      return true;
    } catch (error) {
      console.error("Document service delete error:", error);
      throw new Error("Failed to delete document");
    }
  }

  async getDocuments(
    userId: string,
    options: GetDocumentsOptions = {}
  ): Promise<{
    data: Document[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
      } = options;

      const rooms = await liveblocksService.getRooms(userId);
      let filteredRooms = rooms.data;

      // Filter by search
      if (search) {
        filteredRooms = filteredRooms.filter((room) =>
          Array.isArray(room.metadata.title)
            ? room.metadata.title[0]
                .toLowerCase()
                .includes(search.toLowerCase())
            : room.metadata.title?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Filter by date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredRooms = filteredRooms.filter(
          (room) => this.parseDate(room.metadata.createdAt) >= fromDate
        );
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredRooms = filteredRooms.filter(
          (room) => this.parseDate(room.metadata.createdAt) <= toDate
        );
      }

      // Sort
      filteredRooms.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case "title":
            aValue = a.metadata.title || "";
            bValue = b.metadata.title || "";
            break;
          case "createdAt":
          default:
            aValue = this.parseDate(a.metadata.createdAt).getTime();
            bValue = this.parseDate(b.metadata.createdAt).getTime();
            break;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagination
      const totalCount = filteredRooms.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

      const documents: Document[] = paginatedRooms.map((room) => ({
        id: room.id,
        title: room.metadata.title || "Untitled Document",
        roomId: room.id,
        createdBy: room.metadata.createdBy,
        collaborators: Object.keys(room.usersAccesses || {}).filter(
          (id) => id !== room.metadata.createdBy
        ),
        createdAt: this.parseDate(room.metadata.createdAt),
        updatedAt: this.parseDate(
          room.lastConnectionAt || room.metadata.createdAt
        ),
      }));

      return {
        data: documents,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("Document service get documents error:", error);
      throw new Error("Failed to get documents");
    }
  }

  private generateRoomId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkUserAccess(room: any, userId: string): boolean {
    return (
      room.metadata.createdBy === userId ||
      (room.usersAccesses && room.usersAccesses[userId])
    );
  }

  private checkUserWriteAccess(room: any, userId: string): boolean {
    if (room.metadata.createdBy === userId) {
      return true;
    }

    const userAccess = room.usersAccesses?.[userId];
    return userAccess && userAccess.includes("room:write");
  }

  private parseDate(value: any): Date {
    if (!value) return new Date();
    const v = Array.isArray(value) ? value[0] : value;
    return new Date(v);
  }
}

export const documentService = new DocumentService();
