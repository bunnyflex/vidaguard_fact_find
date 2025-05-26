import {
  ClerkProvider as BaseClerkProvider,
  useUser,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey && import.meta.env.PROD) {
  throw new Error("Missing Clerk Publishable Key");
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}

export { useUser };
