import { createClerkClient } from "@clerk/express";
import { User } from "../types";
import { config } from "../../config/environment";

// Create Clerk client instance
const clerkClient = createClerkClient({
  secretKey: config.clerkSecretKey,
});

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
      const usersResponse = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      const users: any[] = Array.isArray(usersResponse)
        ? usersResponse
        : usersResponse && "data" in usersResponse
        ? (usersResponse as any).data
        : "results" in (usersResponse as any)
        ? (usersResponse as any).results
        : [];

      if (users.length === 0) {
        return null;
      }

      const clerkUser = users[0];
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
      const sessionToken = await (clerkClient as any).verifyToken(token);
      return sessionToken;
    } catch (error) {
      console.error("Clerk verify token error:", error);
      throw new Error("Invalid token");
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const usersResponse = await clerkClient.users.getUserList({
        query,
        limit,
      });

      // get the underlying array from the response whether it's returned directly
      // or wrapped in a paginated object (e.g. { data: [...] } or { results: [...] })
      const usersList: any[] = Array.isArray(usersResponse)
        ? usersResponse
        : usersResponse && "data" in usersResponse
        ? (usersResponse as any).data
        : "results" in (usersResponse as any)
        ? (usersResponse as any).results
        : [];

      return usersList.map((clerkUser) => ({
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
