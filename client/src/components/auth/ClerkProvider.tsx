import { ClerkProvider as BaseClerkProvider, ClerkLoaded, ClerkLoading, useUser as useClerkUser } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ui/theme-provider";
import { createContext, useContext, useState } from "react";

// Get the Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const devMode = !clerkPubKey;

// Create a mock user context for development without Clerk
interface MockUserContextType {
  isSignedIn: boolean;
  user: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    emailAddresses: { emailAddress: string }[];
  } | null;
  setUser: (user: any) => void;
}

const MockUserContext = createContext<MockUserContextType>({
  isSignedIn: false,
  user: null,
  setUser: () => {}
});

// Combined hook that works with or without Clerk
export function useUser() {
  // If in dev mode, use our mock implementation
  if (devMode) {
    return useMockUser();
  }
  
  // Otherwise use the real Clerk implementation
  return useClerkUser();
}

// Hook to access mock user
export const useMockUser = () => useContext(MockUserContext);

// Mock user provider when no Clerk key is available
function MockUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUserContextType["user"]>(null);
  
  // In development mode, we consider a null user as not signed in
  const isSignedIn = !!user;

  return (
    <MockUserContext.Provider value={{ isSignedIn, user, setUser }}>
      {children}
    </MockUserContext.Provider>
  );
}

// Wrap Clerk provider with loading states
export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  // If no Clerk key is available, use the mock provider instead
  if (!clerkPubKey) {
    console.warn("Missing Clerk publishable key. Using development mode with mock authentication.");
    return <MockUserProvider>{children}</MockUserProvider>;
  }
  
  // Otherwise use the actual Clerk provider
  return (
    <BaseClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90",
          card: "rounded-lg shadow-sm",
          headerTitle: "text-xl font-semibold",
        },
      }}
    >
      <ClerkLoading>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </BaseClerkProvider>
  );
}
