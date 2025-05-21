import { ClerkProvider as BaseClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ui/theme-provider";
import { createContext, useContext, useState } from "react";

// Get the Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const devMode = !clerkPubKey;

// Define a common user interface both for real and mock auth
export interface AuthUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  emailAddresses: { emailAddress: string }[];
}

// Create a unified auth context with a common interface
export interface AuthContextType {
  isSignedIn: boolean;
  user: AuthUser | null;
  signIn: () => void;
  signOut: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {}
});

// Unified hook for authentication that works in both environments
export function useUser() {
  return useContext(AuthContext);
}

// Development mode auth provider
function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const isSignedIn = !!user;
  
  // Sign in for development mode
  const signIn = () => {
    setUser({
      id: "dev-user-123",
      fullName: "Test User",
      firstName: "Test",
      lastName: "User",
      emailAddresses: [{ emailAddress: "test@example.com" }]
    });
  };
  
  // Sign out for development mode
  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isSignedIn, 
      user, 
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Wrap Clerk provider with loading states
export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  // If no Clerk key is available, use development auth provider
  if (!clerkPubKey) {
    console.warn("Missing Clerk publishable key. Using development mode with mock authentication.");
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  
  // Production mode - for now we'll use the dev provider
  // until we fully integrate Clerk's authentication
  return <DevAuthProvider>{children}</DevAuthProvider>;
  
  /* 
  TODO: Fully implement Clerk authentication when API keys are available
  
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
      <ClerkLoaded>
        <ClerkAuthProvider>
          {children}
        </ClerkAuthProvider>
      </ClerkLoaded>
    </BaseClerkProvider>
  );
  */
}
