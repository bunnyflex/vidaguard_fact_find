import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/components/auth/ClerkProvider";
import { Badge } from "@/components/ui/badge";

export default function AppHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if Clerk is available via publishable key
  const devMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Use our universal authentication hook that works in both environments
  const { isSignedIn, user, signIn, signOut } = useUser();

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

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">I</span>
            </div>
            <h1 className="font-bold text-xl">InsureAI</h1>
            {devMode && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-800">
                Development Mode
              </Badge>
            )}
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
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : ""}`}>
                Dashboard
              </span>
            </Link>
            <Link href="/admin">
              <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/admin" ? "text-primary" : ""}`}>
                Admin
              </span>
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
                    <DropdownMenuItem onClick={signOut}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="default" size="sm" onClick={signIn}>
                    Sign In {devMode ? "(Development)" : ""}
                  </Button>
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
              <div className="flex items-center gap-2 font-semibold">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">I</span>
                </div>
                <span>InsureAI</span>
              </div>
            </Link>
            <button className="ml-auto rounded-md p-1" onClick={closeMobileMenu}>
              <i className="fas fa-times text-lg"></i>
              <span className="sr-only">Close</span>
            </button>
          </div>
          <nav className="grid gap-2 p-4">
            <Link href="/">
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${location === "/" ? "bg-secondary" : ""}`}>
                <i className="fas fa-home text-muted-foreground"></i>
                <span>Dashboard</span>
              </div>
            </Link>
            <Link href="/admin">
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary ${location === "/admin" ? "bg-secondary" : ""}`}>
                <i className="fas fa-cog text-muted-foreground"></i>
                <span>Admin</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary">
              <i className="fas fa-question-circle text-muted-foreground"></i>
              <span>Help</span>
            </div>
            {!isSignedIn && (
              <div className="mt-4">
                <Button className="w-full" onClick={signIn}>
                  Sign In {devMode ? "(Development Mode)" : ""}
                </Button>
              </div>
            )}
            {isSignedIn && (
              <div className="mt-4 border-t pt-4">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Signed in as: {user?.fullName || (user?.emailAddresses && user.emailAddresses[0]?.emailAddress)}
                </div>
                <Button variant="outline" className="w-full mt-2" onClick={signOut}>
                  Sign Out {devMode ? "(Development)" : ""}
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
