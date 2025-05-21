import { useState, useEffect } from "react";
import { useUser } from "@/components/auth/ClerkProvider";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Answer {
  id: number;
  sessionId: number;
  questionId: number;
  value: string;
  createdAt: string;
}

export function useFactFind() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create a new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sessions", {
        userId: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        status: "in-progress",
      });
    },
    onSuccess: (data) => {
      setSessionId(data.id);
    },
  });

  // Save answer to a question
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, value }: { questionId: number; value: string }) => {
      if (!sessionId) throw new Error("No active session");
      
      return apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/answers`, 
        {
          questionId,
          value,
        }
      );
    },
    onSuccess: (data) => {
      setAnswers((prev) => {
        // Replace answer if it already exists, otherwise add it
        const existingIndex = prev.findIndex(a => a.questionId === data.questionId);
        if (existingIndex >= 0) {
          const newAnswers = [...prev];
          newAnswers[existingIndex] = data;
          return newAnswers;
        } else {
          return [...prev, data];
        }
      });
    },
  });

  // Fetch existing session if available
  useEffect(() => {
    const fetchExistingSession = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch("/api/sessions");
        
        if (response.ok) {
          const sessions = await response.json();
          
          // Find most recent incomplete session if it exists
          const incompleteSession = sessions.find((s: any) => !s.completedAt);
          
          if (incompleteSession) {
            setSessionId(incompleteSession.id);
            
            // Fetch answers for this session
            const answersResponse = await fetch(`/api/sessions/${incompleteSession.id}`);
            
            if (answersResponse.ok) {
              const data = await answersResponse.json();
              setAnswers(data.answers || []);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching existing session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingSession();
  }, [user]);

  // Create a new session
  const createSession = async () => {
    if (!user) throw new Error("User must be logged in");
    return createSessionMutation.mutateAsync();
  };

  // Save an answer
  const saveAnswer = async (questionId: number, value: string) => {
    if (!user) throw new Error("User must be logged in");
    return saveAnswerMutation.mutateAsync({ questionId, value });
  };

  // Get all answers for the current session
  const getSessionAnswers = async (): Promise<Answer[]> => {
    if (!sessionId) return [];
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.answers || [];
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching session answers:", error);
      return [];
    }
  };

  return {
    sessionId,
    answers,
    isLoading,
    createSession,
    saveAnswer,
    getSessionAnswers,
  };
}
