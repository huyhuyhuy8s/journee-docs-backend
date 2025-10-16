import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { AuthRequest, User } from "../types";

export const authMiddleware = async (
  req: AuthRequest & Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    console.log(
      "Auth middleware - Headers:",
      JSON.stringify(req.headers, null, 2)
    );
    console.log("Auth middleware - Authorization header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Auth middleware - No valid authorization header");
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log(
      "Auth middleware - Token:",
      token ? `Present (${token.length} chars)` : "Missing"
    );

    // Verify token with Clerk
    console.log("Auth middleware - Verifying token with Clerk...");
    const sessionToken = await clerkClient.verifyToken(token);
    console.log("Auth middleware - Token verified, userId:", sessionToken.sub);

    const userId = sessionToken.sub;

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    const user: User = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      avatar: clerkUser.imageUrl || undefined,
      color: generateUserColor(clerkUser.id),
    };

    req.user = user;
    console.log("Auth middleware - Success, user:", user);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// Helper function to generate user color
function generateUserColor(userId: string): string {
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
