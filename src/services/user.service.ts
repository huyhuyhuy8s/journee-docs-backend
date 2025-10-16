import { clerkClient } from "@clerk/clerk-sdk-node";
import { User } from "../types";

class UserService {
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log("🔍 Looking up user by email:", email);

      const users = (await clerkClient.users.getUserList({
        emailAddress: [email],
        limit: 1,
      })) as unknown as any[];

      if (!users || users.length === 0) {
        console.log("❌ User not found with email:", email);
        return null;
      }

      const clerkUser = users[0];

      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "Unknown User",
        avatar: clerkUser.imageUrl || undefined,
        color: this.generateUserColor(clerkUser.id),
      };

      console.log("✅ User found:", user.name, "(", user.email, ")");
      return user;
    } catch (error) {
      console.error("❌ Error looking up user by email:", error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      console.log("🔍 Looking up user by ID:", userId);

      const clerkUser = await clerkClient.users.getUser(userId);

      const user: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name:
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          "Unknown User",
        avatar: clerkUser.imageUrl || undefined,
        color: this.generateUserColor(clerkUser.id),
      };

      console.log("✅ User found by ID:", user.name);
      return user;
    } catch (error) {
      console.error("❌ Error looking up user by ID:", error);
      return null;
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

export const userService = new UserService();
