// This is a mock replacement for Clerk authentication
// We're providing a simplified version since we've disabled auth requirements

import React from "react";
import {
  ClerkProvider as BaseClerkProvider,
  SignIn,
  SignUp,
  useUser,
  UserButton,
  SignInButton,
  SignUpButton,
  useClerk,
  useSignIn,
  useSignUp,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Clerk Publishable Key - Please set VITE_CLERK_PUBLISHABLE_KEY in your environment"
  );
}

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
  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      {children}
    </BaseClerkProvider>
  );
}
