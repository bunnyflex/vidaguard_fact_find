import { useState } from "react";
import { SignInButton } from "@clerk/clerk-react";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import FactFindChat from "@/components/client/FactFindChat";
import SignatureView from "@/components/client/SignatureView";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/auth/ClerkProvider";

export default function Home() {
  // Check if Clerk is available via publishable key
  const clerkAvailable = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Use our custom hook that works in both environments
  const { isSignedIn, user } = useUser();
  
  const [showSignature, setShowSignature] = useState(false);
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const handleCompleteFactFind = (sessionId: number, answers: Array<{ question: string; answer: string }>) => {
    setSessionId(sessionId);
    setAnswers(answers);
    setShowSignature(true);
  };

  const handleGoBack = () => {
    setShowSignature(false);
  };

  // Get the sign-in function from our authentication hook
  const { signIn } = useUser();
  
  // Mock sign-in function when Clerk is not available
  const handleMockSignIn = () => {
    if (!clerkAvailable) {
      signIn();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {!isSignedIn ? (
          <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to InsureAI</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Please sign in to start or continue your insurance fact find process.
            </p>
            
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
        ) : (
          <>
            {!showSignature ? (
              <FactFindChat onComplete={handleCompleteFactFind} />
            ) : (
              <SignatureView 
                answers={answers} 
                sessionId={sessionId!}
                onGoBack={handleGoBack} 
              />
            )}
          </>
        )}
      </main>
      
      <AppFooter />
    </div>
  );
}
