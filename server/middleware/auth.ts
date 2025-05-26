import { Request, Response, NextFunction } from "express";
import { Clerk } from "@clerk/clerk-sdk-node";
import { storage } from "../storage";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error(
    "Missing CLERK_SECRET_KEY - Please set this environment variable"
  );
}

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
    console.log("Auth headers:", req.headers);

    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No Bearer token found in Authorization header");
      return res.status(401).json({ message: "No session token provided" });
    }

    const sessionToken = authHeader.split(" ")[1];
    if (!sessionToken) {
      console.log("Empty token after Bearer prefix");
      return res.status(401).json({ message: "No session token provided" });
    }

    try {
      console.log("Attempting to verify session token");
      // Verify the session with Clerk
      const session = await clerk.sessions.verifySession(
        sessionToken,
        sessionToken
      );
      if (!session) {
        console.log("Session verification returned null");
        return res.status(401).json({ message: "Invalid session" });
      }
      console.log("Session verified successfully:", session.id);

      // Get or create the user in our database
      console.log("Fetching Clerk user:", session.userId);
      const clerkUser = await clerk.users.getUser(session.userId);
      if (!clerkUser) {
        console.log("User not found in Clerk");
        return res.status(401).json({ message: "User not found in Clerk" });
      }
      console.log("Found Clerk user:", clerkUser.id);

      let user = await storage.getUserByClerkId(session.userId);
      if (!user) {
        console.log("User not found in local database, creating new user");
        // Create a new user in our database
        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
        if (!primaryEmail) {
          console.log("No primary email found for user");
          return res
            .status(400)
            .json({ message: "User must have an email address" });
        }

        user = await storage.createUser({
          clerkId: session.userId,
          email: primaryEmail,
          isAdmin: false,
        });

        if (!user) {
          console.log("Failed to create user in database");
          return res.status(500).json({ message: "Failed to create user" });
        }
        console.log("Created new user in database:", user.id);
      } else {
        console.log("Found existing user in database:", user.id);
      }

      // Attach the user to the request
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        isAdmin: user.isAdmin ?? false,
        createdAt: user.createdAt ?? new Date(),
      };

      req.auth = {
        sessionId: session.id,
        userId: session.userId,
      };

      console.log("Authentication successful for user:", user.id);
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
