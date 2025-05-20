import { useEffect } from "react";
import { useLocation } from "wouter";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function Auth() {
  const { isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const mode = params.get("mode") || "signin";
  
  // Redirect to home if already signed in
  useEffect(() => {
    if (isSignedIn) {
      setLocation("/");
    }
  }, [isSignedIn, setLocation]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6">
              {mode === "signup" ? (
                <SignUp signInUrl="/auth?mode=signin" />
              ) : (
                <SignIn signUpUrl="/auth?mode=signup" />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
