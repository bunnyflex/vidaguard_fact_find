import { useState } from "react";
import { useUser } from "@/components/auth/ClerkProvider";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { isSignedIn, user, signIn } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Development mode check
  const devMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Check if user is admin
  const { isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      if (!isSignedIn) return null;

      // Development mode check
      const devMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      
      if (devMode) {
        // In development mode, automatically set the user as an admin
        setIsAdmin(true);
        return { isAdmin: true };
      }
      
      // In production, check with the server
      const res = await fetch("/api/me", {
        headers: {
          "x-clerk-user-id": user?.id || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user data");
      const userData = await res.json();
      setIsAdmin(userData.isAdmin);
      return userData;
    },
    enabled: isSignedIn === true,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {!isSignedIn ? (
          <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Admin Access</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Please sign in to access the admin dashboard.
            </p>
            <Button 
              className="w-full" 
              onClick={signIn}
            >
              Sign In {devMode ? "(Development Mode)" : ""}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isAdmin === false ? (
          <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="mb-6 text-gray-600">
              You do not have admin privileges to access this dashboard.
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <AdminDashboard />
        )}
      </main>
      
      <AppFooter />
    </div>
  );
}
