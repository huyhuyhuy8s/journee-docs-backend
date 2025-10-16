import { Liveblocks } from "@liveblocks/node";
import { config } from "../../config/environment";
import { User } from "../types";

const liveblocks = new Liveblocks({
  secret: config.liveblocksSecretKey,
});

class LiveblocksService {
  async identifyUser(user: User) {
    try {
      console.log("Liveblocks identifying user:", user.id);

      const { status, body } = await liveblocks.identifyUser(
        {
          userId: user.id, // Use Clerk user ID consistently
          groupIds: [], // Add groups if you have team/organization logic
        },
        {
          userInfo: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            color: user.color,
          },
        }
      );

      console.log("Liveblocks auth successful for user:", user.id);
      return { status, body };
    } catch (error) {
      console.error("Liveblocks identify user error:", error);
      throw error;
    }
  }

  async createRoom(roomId: string, userId: string, metadata: any = {}) {
    try {
      console.log("Creating Liveblocks room:", roomId, "for user:", userId);

      const room = await liveblocks.createRoom(roomId, {
        defaultAccesses: [], // No default access
        usersAccesses: {
          [userId]: ["room:write"], // Give creator write access
        },
        metadata: {
          title: metadata.title || "Untitled Document",
          createdBy: userId,
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      });

      console.log("Room created successfully:", roomId);
      return room;
    } catch (error) {
      console.error("Create room error:", error);
      throw error;
    }
  }

  async updateRoomAccess(
    roomId: string,
    userId: string,
    access: ["room:write"] | ["room:read", "room:presence:write"] | null = [
      "room:write",
    ]
  ) {
    try {
      console.log(
        "Updating room access:",
        roomId,
        "for user:",
        userId,
        "access:",
        access
      );

      await liveblocks.updateRoom(roomId, {
        usersAccesses: {
          [userId]: access,
        },
      });

      console.log("Room access updated successfully");
    } catch (error) {
      console.error("Update room access error:", error);
      throw error;
    }
  }

  async addCollaborator(
    roomId: string,
    userId: string,
    access: ["room:write"] | ["room:read", "room:presence:write"] | null = [
      "room:write",
    ]
  ) {
    try {
      // Get current room data
      const room = await liveblocks.getRoom(roomId);

      // Add new user access
      const updatedAccess = {
        ...room.usersAccesses,
        [userId]: access,
      };

      await liveblocks.updateRoom(roomId, {
        usersAccesses: updatedAccess,
      });

      console.log("Collaborator added to room:", roomId, "user:", userId);
    } catch (error) {
      console.error("Add collaborator error:", error);
      throw error;
    }
  }

  async removeCollaborator(roomId: string, userId: string) {
    try {
      // Get current room data
      const room = await liveblocks.getRoom(roomId);

      // Remove user access
      const updatedAccess = { ...room.usersAccesses };
      delete updatedAccess[userId];

      await liveblocks.updateRoom(roomId, {
        usersAccesses: updatedAccess,
      });

      console.log("Collaborator removed from room:", roomId, "user:", userId);
    } catch (error) {
      console.error("Remove collaborator error:", error);
      throw error;
    }
  }

  async deleteRoom(roomId: string) {
    try {
      await liveblocks.deleteRoom(roomId);
      console.log("Room deleted:", roomId);
    } catch (error) {
      console.error("Delete room error:", error);
      throw error;
    }
  }

  async updateRoomMetadata(roomId: string, metadata: any) {
    try {
      console.log("📝 Updating Liveblocks room metadata:", roomId, metadata);

      await liveblocks.updateRoom(roomId, {
        metadata: {
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      });

      console.log("✅ Room metadata updated successfully");
    } catch (error) {
      console.error("❌ Update room metadata error:", error);
      throw error;
    }
  }
}

export const liveblocksService = new LiveblocksService();
