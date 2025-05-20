import { ClerkProvider as BaseClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ui/theme-provider";

// Get the Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

// Wrap Clerk provider with loading states
export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  if (!clerkPubKey) {
    console.warn("Missing Clerk publishable key. Authentication will not work properly.");
  }
  
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
