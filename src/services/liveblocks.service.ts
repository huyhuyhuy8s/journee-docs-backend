import { Liveblocks } from "@liveblocks/node";
import { config } from "../../config/environment";
import { User } from "../types";

class LiveblocksService {
  private liveblocks: Liveblocks;

  constructor() {
    this.liveblocks = new Liveblocks({
      secret: config.liveblocksSecretKey,
    });
  }

  async identifyUser(user: User, groupIds: string[] = []) {
    try {
      const { status, body } = await this.liveblocks.identifyUser(
        {
          userId: user.email,
          groupIds,
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

      return { status, body };
    } catch (error) {
      console.error("Liveblocks identify user error:", error);
      throw new Error("Failed to identify user with Liveblocks");
    }
  }

  async createRoom(roomId: string, userId: string, metadata: any = {}) {
    try {
      const room = await this.liveblocks.createRoom(roomId, {
        defaultAccesses: [],
        usersAccesses: {
          [userId]: ["room:write"],
        },
        metadata: {
          createdBy: userId,
          ...metadata,
        },
      });

      return room;
    } catch (error) {
      console.error("Liveblocks create room error:", error);
      throw new Error("Failed to create room");
    }
  }

  async getRoom(roomId: string) {
    try {
      const room = await this.liveblocks.getRoom(roomId);
      return room;
    } catch (error) {
      console.error("Liveblocks get room error:", error);
      throw new Error("Room not found");
    }
  }

  async updateRoom(roomId: string, updates: any) {
    try {
      const room = await this.liveblocks.updateRoom(roomId, updates);
      return room;
    } catch (error) {
      console.error("Liveblocks update room error:", error);
      throw new Error("Failed to update room");
    }
  }

  async deleteRoom(roomId: string) {
    try {
      await this.liveblocks.deleteRoom(roomId);
      return true;
    } catch (error) {
      console.error("Liveblocks delete room error:", error);
      throw new Error("Failed to delete room");
    }
  }

  async addUserToRoom(
    roomId: string,
    userId: string,
    permissions: ["room:write"] | ["room:read", "room:presence:write"] = [
      "room:write",
    ]
  ) {
    try {
      await this.liveblocks.updateRoom(roomId, {
        usersAccesses: {
          [userId]: permissions as
            | ["room:write"]
            | ["room:read", "room:presence:write"],
        },
      });
      return true;
    } catch (error) {
      console.error("Liveblocks add user to room error:", error);
      throw new Error("Failed to add user to room");
    }
  }

  async removeUserFromRoom(roomId: string, userId: string) {
    try {
      await this.liveblocks.updateRoom(roomId, {
        usersAccesses: {
          [userId]: null,
        },
      });
      return true;
    } catch (error) {
      console.error("Liveblocks remove user from room error:", error);
      throw new Error("Failed to remove user from room");
    }
  }

  async getRooms(userId?: string) {
    try {
      const rooms = await this.liveblocks.getRooms({
        userId,
        limit: 100,
      });
      return rooms;
    } catch (error) {
      console.error("Liveblocks get rooms error:", error);
      throw new Error("Failed to get rooms");
    }
  }
}

export const liveblocksService = new LiveblocksService();
