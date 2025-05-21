import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/components/auth/ClerkProvider";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function Auth() {
  const { isSignedIn, signIn } = useUser();
  const [, setLocation] = useLocation();
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const mode = params.get("mode") || "signin";
  
  // Form state
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password");
  const [name, setName] = useState("Test User");
  const [isLoading, setIsLoading] = useState(false);
  
  // Development mode indicator
  const devMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Redirect to home if already signed in
  useEffect(() => {
    if (isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, setLocation]);
  
  // Handle sign in
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In development mode, we just call our auth hook
    setTimeout(() => {
      signIn();
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle sign up - in dev mode, this is the same as sign in
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In development mode, we just call our auth hook
    setTimeout(() => {
      signIn();
      setIsLoading(false);
    }, 1000);
  };
  
  // Toggle between sign in and sign up
  const toggleMode = () => {
    setLocation(`/auth?mode=${mode === "signin" ? "signup" : "signin"}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6">
              {devMode && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    Running in development mode. No real authentication will be performed.
                  </p>
                </div>
              )}
              
              <h2 className="text-2xl font-bold mb-6 text-center">
                {mode === "signup" ? "Create an account" : "Sign in to your account"}
              </h2>
              
              <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn}>
                {mode === "signup" && (
                  <div className="mb-4">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Loading..." : mode === "signup" ? "Sign up" : "Sign in"}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <button 
                  type="button" 
                  className="text-sm text-primary hover:underline" 
                  onClick={toggleMode}
                >
                  {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
