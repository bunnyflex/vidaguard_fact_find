import { useEffect } from "react";
import { useLocation } from "wouter";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useUser } from "@/components/auth/ClerkProvider";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

export default function Auth() {
  const { isSignedIn } = useUser();
  const [location] = useLocation();

  // Redirect to home if already signed in and not in a specific auth flow
  useEffect(() => {
    if (isSignedIn && location === "/auth") {
      window.location.href = "/";
    }
  }, [isSignedIn, location]);

  // Determine which component to show based on the path
  const showSignUp = location.includes("sign-up");
  const isVerification = location.includes("verify-email");
  const isPasswordReset = location.includes("reset-password");
  const isSSOCallback = location.includes("sso-callback");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container max-w-screen-xl mx-auto p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          {showSignUp ? (
            <SignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl="/auth"
              redirectUrl="/"
              unsafeMetadata={{ role: "user" }}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-lg shadow-md",
                },
              }}
            />
          ) : (
            <SignIn
              routing="path"
              path="/auth"
              signUpUrl="/auth/sign-up"
              redirectUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-lg shadow-md",
                },
              }}
            />
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
