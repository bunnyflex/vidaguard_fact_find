import { useState } from "react";
import { useUser } from "@/components/auth/ClerkProvider";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Admin() {
  const { isSignedIn, user } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  // Check if user is admin
  const { isLoading } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      if (!isSignedIn || !user) {
        setLocation("/auth");
        return null;
      }

      // Check with the server
      const res = await fetch("/api/me");

      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/auth");
          return null;
        }
        throw new Error("Failed to fetch user data");
      }

      const userData = await res.json();
      setIsAdmin(userData.isAdmin);
      return userData;
    },
    enabled: isSignedIn === true,
  });

  if (!isSignedIn) {
    return null; // Will redirect in the query
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container max-w-screen-xl mx-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container max-w-screen-xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You do not have permission to access this page.
            </p>
            <Button onClick={() => setLocation("/")}>Return to Home</Button>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <AdminDashboard />
      <AppFooter />
    </div>
  );
}
