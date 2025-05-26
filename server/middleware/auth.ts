import { Request, Response, NextFunction } from "express";
import { Clerk } from "@clerk/clerk-sdk-node";
import { storage } from "../storage";

// Initialize Clerk
const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    clerkId: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
  };
  auth?: {
    sessionId: string;
    userId: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No session token provided" });
    }

    const sessionToken = authHeader.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({ message: "No session token provided" });
    }

    try {
      // Verify the session with Clerk
      const session = await clerk.sessions.verifySession(
        sessionToken,
        sessionToken
      );

      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Get or create the user in our database
      const clerkUser = await clerk.users.getUser(session.userId);
      let user = await storage.getUserByClerkId(session.userId);

      if (!user) {
        // Create a new user in our database
        user = await storage.createUser({
          clerkId: session.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          isAdmin: false,
        });

        if (!user) {
          return res.status(500).json({ message: "Failed to create user" });
        }
      }

      // Attach the user to the request with proper type assertions
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        isAdmin: user.isAdmin ?? false, // Use false as default if null
        createdAt: user.createdAt ?? new Date(), // Use current date if null
      };

      req.auth = {
        sessionId: session.id,
        userId: session.userId,
      };

      next();
    } catch (error) {
      console.error("Session verification error:", error);
      return res.status(401).json({ message: "Invalid session" });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
