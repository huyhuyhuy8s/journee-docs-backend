import { clerkClient } from "@clerk/clerk-sdk-node";
import { User } from "../types";

class ClerkService {
  async getUser(userId: string): Promise<User> {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);

      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        avatar: clerkUser.imageUrl || undefined,
        color: this.generateUserColor(clerkUser.id),
      };
    } catch (error) {
      console.error("Clerk get user error:", error);
      throw new Error("Failed to get user from Clerk");
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        return null;
      }

      const clerkUser = users.data[0];
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        avatar: clerkUser.imageUrl || undefined,
        color: this.generateUserColor(clerkUser.id),
      };
    } catch (error) {
      console.error("Clerk get user by email error:", error);
      throw new Error("Failed to get user by email");
    }
  }

  async verifyToken(token: string) {
    try {
      const sessionToken = await clerkClient.verifyToken(token);
      return sessionToken;
    } catch (error) {
      console.error("Clerk verify token error:", error);
      throw new Error("Invalid token");
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const users = await clerkClient.users.getUserList({
        query,
        limit,
      });

      return users.data.map((clerkUser: any) => ({
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        avatar: clerkUser.imageUrl || undefined,
        color: this.generateUserColor(clerkUser.id),
      }));
    } catch (error) {
      console.error("Clerk search users error:", error);
      throw new Error("Failed to search users");
    }
  }

  private generateUserColor(userId: string): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}

export const clerkService = new ClerkService();
