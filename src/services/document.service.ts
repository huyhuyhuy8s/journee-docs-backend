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
        createdBy: userId, // Use Clerk ID for consistency
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

      // Check if user has access using Clerk ID (for consistency with existing system)
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
        collaborators: await Promise.all(
          Object.entries(room.usersAccesses || {}).map(
            async ([userId, permissions]) => {
              try {
                // Fetch user details for each collaborator
                const user = await clerkService.getUser(userId);
                return {
                  id: userId,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar || "",
                  permission: (permissions as string[]).includes("room:write")
                    ? ("room:write" as const)
                    : ("room:read" as const),
                };
              } catch (error) {
                // Fallback for users that can't be fetched
                console.warn(
                  `Could not fetch user details for ${userId}:`,
                  error
                );
                return {
                  id: userId,
                  name: `User ${userId.slice(-4)}`,
                  email: `${userId}@example.com`,
                  avatar: "",
                  permission: (permissions as string[]).includes("room:write")
                    ? ("room:write" as const)
                    : ("room:read" as const),
                };
              }
            }
          )
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

      // Check if user has write access using Clerk ID
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

      const createdByNormalized = Array.isArray(updatedRoom.metadata.createdBy)
        ? updatedRoom.metadata.createdBy[0]
        : updatedRoom.metadata.createdBy || "Unknown";

      return {
        id: updatedRoom.id,
        title: Array.isArray(updatedRoom.metadata.title)
          ? updatedRoom.metadata.title[0]
          : updatedRoom.metadata.title || "Untitled Document",
        roomId: updatedRoom.id,
        createdBy: createdByNormalized,
        collaborators: Object.entries(updatedRoom.usersAccesses || {})
          .filter(([id]) => id !== createdByNormalized)
          .map(([id, permissions]) => ({
            id,
            permission: (permissions as string[]).includes("room:write")
              ? ("room:write" as const)
              : ("room:read" as const),
          })),
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

  async inviteCollaborator(
    roomId: string,
    userId: string,
    email: string,
    permission: string = "room:write"
  ): Promise<any> {
    try {
      // Check if user has access to the document
      const room = await liveblocksService.getRoom(roomId);

      if (!this.checkUserWriteAccess(room, userId)) {
        throw new Error("Access denied");
      }

      // Find user by email
      const invitedUser = await clerkService.getUserByEmail(email);
      if (!invitedUser) {
        throw new Error("User not found");
      }

      // Add user to room using Clerk ID for consistency
      await liveblocksService.addUserToRoom(
        roomId,
        invitedUser.id, // Use Clerk ID instead of email
        permission === "room:read"
          ? ["room:read", "room:presence:write"]
          : ["room:write"]
      );

      // Trigger notification
      const notificationId = `notif_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await liveblocksService.triggerInboxNotification({
        userId: invitedUser.id, // Use Clerk ID for consistency
        kind: "$documentAccess",
        subjectId: notificationId,
        activityData: {
          userType: permission === "room:write" ? "editor" : "viewer",
          title: `You have been granted ${
            permission === "room:write" ? "editor" : "viewer"
          } access to the document`,
          updatedBy: userId,
        },
        roomId,
      });

      return {
        user: invitedUser,
        permission,
        invitedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Document service invite collaborator error:", error);
      throw error;
    }
  }

  async removeCollaborator(
    roomId: string,
    userId: string,
    collaboratorId: string
  ): Promise<void> {
    try {
      // Check if user has access to the document
      const room = await liveblocksService.getRoom(roomId);
      if (
        !this.checkUserWriteAccess(room, userId) &&
        room.metadata.createdBy !== userId
      ) {
        throw new Error("Access denied");
      }

      // Remove user from room
      await liveblocksService.removeUserFromRoom(roomId, collaboratorId);
    } catch (error) {
      console.error("Document service remove collaborator error:", error);
      throw error;
    }
  }

  async getDocumentAccess(roomId: string, userId: string): Promise<any> {
    try {
      const room = await liveblocksService.getRoom(roomId);

      if (!this.checkUserAccess(room, userId)) {
        throw new Error("Access denied");
      }

      return {
        roomId: room.id,
        usersAccesses: room.usersAccesses || {},
        defaultAccesses: room.defaultAccesses || [],
        metadata: room.metadata,
      };
    } catch (error) {
      console.error("Document service get access error:", error);
      throw error;
    }
  }

  async updateDocumentAccess(
    roomId: string,
    userId: string,
    usersAccesses: any
  ): Promise<any> {
    try {
      const room = await liveblocksService.getRoom(roomId);

      if (
        !this.checkUserWriteAccess(room, userId) &&
        room.metadata.createdBy !== userId
      ) {
        throw new Error("Access denied");
      }

      const updateData = {
        usersAccesses,
        metadata: {
          ...room.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      const updatedRoom = await liveblocksService.updateRoom(
        roomId,
        updateData
      );

      return {
        roomId: updatedRoom.id,
        usersAccesses: updatedRoom.usersAccesses || {},
        defaultAccesses: updatedRoom.defaultAccesses || [],
        metadata: updatedRoom.metadata,
      };
    } catch (error) {
      console.error("Document service update access error:", error);
      throw error;
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
      console.log("Document service - getDocuments called");
      console.log("Document service - userId:", userId);
      console.log("Document service - options:", options);

      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
      } = options;

      console.log("Document service - Calling liveblocksService.getRooms...");
      const rooms = await liveblocksService.getRooms(userId);
      console.log("Document service - Rooms response:", rooms);

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
        title: Array.isArray(room.metadata.title)
          ? room.metadata.title[0]
          : room.metadata.title || "Untitled Document",
        roomId: room.id,
        createdBy: Array.isArray(room.metadata.createdBy)
          ? room.metadata.createdBy[0]
          : room.metadata.createdBy || "Unknown",
        collaborators: Object.entries(room.usersAccesses || {})
          .filter(
            ([id]) =>
              id !==
              (Array.isArray(room.metadata.createdBy)
                ? room.metadata.createdBy[0]
                : room.metadata.createdBy)
          )
          .map(([id, permissions]) => ({
            id,
            permission: (permissions as string[]).includes("room:write")
              ? ("room:write" as const)
              : ("room:read" as const),
          })),
        createdAt: this.parseDate(room.metadata.createdAt),
        updatedAt: this.parseDate(
          room.lastConnectionAt || room.metadata.createdAt
        ),
      }));

      console.log("Document service - Final documents:", documents);

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
