// This is a mock replacement for Clerk authentication
// We're providing a simplified version since we've disabled auth requirements

import React from "react";
import {
  ClerkProvider as BaseClerkProvider,
  SignIn,
  SignUp,
  useUser as useClerkUser,
  UserButton,
  SignInButton,
  SignUpButton,
  useClerk,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

// Create a mock user context for development
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
}

interface UserContextType {
  isSignedIn: boolean;
  user: User | null;
  signIn: () => void;
  signOut: () => void;
}

const defaultUser: User = {
  id: "dev-user-123",
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
};

const UserContext = React.createContext<UserContextType>({
  isSignedIn: true,
  user: defaultUser,
  signIn: () => {},
  signOut: () => {},
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Re-export Clerk components and hooks for consistent imports across the app
export {
  SignIn,
  SignUp,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useClerk,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-react";

export function ClerkProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    console.warn("No Clerk publishable key found. Using mock authentication.");
    return (
      <UserContext.Provider
        value={{
          isSignedIn: true,
          user: defaultUser,
          signIn: () => {},
          signOut: () => {},
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}
