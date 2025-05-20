import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMockUser } from "@/components/auth/ClerkProvider";

export default function AppHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if Clerk is available via publishable key
  const clerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Use Clerk or mock authentication based on availability
  const clerkAuth = clerkAvailable ? useUser() : { isSignedIn: false, user: null };
  const mockAuth = useMockUser();
  
  // Use the appropriate auth source
  const { isSignedIn, user } = clerkAvailable ? clerkAuth : mockAuth;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const getInitials = () => {
    if (!user?.fullName) return "?";
    return user.fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Mock sign-in function when Clerk is not available
  const handleMockSignIn = () => {
    if (!clerkAvailable && mockAuth.setUser) {
      mockAuth.setUser({
        id: "mock-user-123",
        fullName: "Test User",
        firstName: "Test",
        lastName: "User",
        emailAddresses: [{ emailAddress: "test@example.com" }]
      });
    }
  };
  
  // Mock sign-out function when Clerk is not available
  const handleMockSignOut = () => {
    if (!clerkAvailable && mockAuth.setUser) {
      mockAuth.setUser(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">I</span>
            </div>
            <h1 className="font-bold text-xl">InsureAI</h1>
          </div>

          {/* Mobile menu button */}
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-bars text-lg"></i>
            <span className="sr-only">Open menu</span>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : ""}`}>
                Dashboard
              </a>
            </Link>
            <Link href="/admin">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : ""}`}>
                Admin
              </a>
            </Link>
            <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Help
            </a>

            <div className="relative">
              {isSignedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>
                      {clerkAvailable ? (
                        <SignOutButton>Sign out</SignOutButton>
                      ) : (
                        <button onClick={handleMockSignOut}>Sign out</button>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {clerkAvailable ? (
                    <SignInButton mode="modal">
                      <Button variant="default" size="sm">
                        Sign In
                      </Button>
                    </SignInButton>
                  ) : (
                    <Button variant="default" size="sm" onClick={handleMockSignIn}>
                      Sign In (Dev)
                    </Button>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <div className={`fixed inset-0 z-40 ${mobileMenuOpen ? "" : "hidden"} lg:hidden`}>
        <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu}></div>
        <div className="fixed inset-y-0 left-0 z-40 w-72 bg-background shadow-lg">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/">
              <a className="flex items-center gap-2 font-semibold">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">I</span>
                </div>
                <span>InsureAI</span>
              </a>
            </Link>
            <button className="ml-auto rounded-md p-1" onClick={closeMobileMenu}>
              <i className="fas fa-times text-lg"></i>
              <span className="sr-only">Close</span>
            </button>
          </div>
          <nav className="grid gap-2 p-4">
            <Link href="/">
              <a className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${location === "/" ? "bg-secondary" : ""}`}>
                <i className="fas fa-home text-muted-foreground"></i>
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/admin">
              <a className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${location === "/admin" ? "bg-secondary" : ""}`}>
                <i className="fas fa-cog text-muted-foreground"></i>
                <span>Admin</span>
              </a>
            </Link>
            <a href="#" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary">
              <i className="fas fa-question-circle text-muted-foreground"></i>
              <span>Help</span>
            </a>
            {!isSignedIn && (
              <div className="mt-4">
                {clerkAvailable ? (
                  <SignInButton mode="modal">
                    <Button className="w-full">Sign In</Button>
                  </SignInButton>
                ) : (
                  <Button className="w-full" onClick={handleMockSignIn}>
                    Sign In (Development Mode)
                  </Button>
                )}
              </div>
            )}
            {isSignedIn && (
              <div className="mt-4 border-t pt-4">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Signed in as: {user?.fullName || (user?.emailAddresses && user.emailAddresses[0]?.emailAddress)}
                </div>
                {clerkAvailable ? (
                  <SignOutButton>
                    <Button variant="outline" className="w-full mt-2">
                      Sign Out
                    </Button>
                  </SignOutButton>
                ) : (
                  <Button variant="outline" className="w-full mt-2" onClick={handleMockSignOut}>
                    Sign Out (Development)
                  </Button>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
