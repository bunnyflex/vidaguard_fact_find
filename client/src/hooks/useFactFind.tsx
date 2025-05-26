import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
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
  const { user, isSignedIn } = useUser();
  const { session } = useClerk();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn || !user) {
        throw new Error("User must be logged in");
      }

      // First get the user's database ID
      const userResponse = await apiRequest<{ id: number }>("GET", "/api/me");

      // Create the session with the user's database ID
      const response = await apiRequest("POST", "/api/sessions", {
        userId: userResponse.id,
        status: "in-progress",
      });

      return response;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setError(null);
    },
    onError: (error: Error) => {
      setError(`Failed to create session: ${error.message}`);
      console.error("Session creation error:", error);
    },
  });

  // Save answer to a question
  const saveAnswerMutation = useMutation({
    mutationFn: async ({
      questionId,
      value,
    }: {
      questionId: number;
      value: string;
    }) => {
      if (!isSignedIn || !user) {
        throw new Error("User must be logged in");
      }

      if (!sessionId) {
        throw new Error("No active session");
      }

      const response = await apiRequest(
        "POST",
        `/api/sessions/${sessionId}/answers`,
        {
          questionId,
          value,
        }
      );

      return response;
    },
    onSuccess: (data) => {
      setAnswers((prev) => {
        const existingIndex = prev.findIndex(
          (a) => a.questionId === data.questionId
        );
        if (existingIndex >= 0) {
          const newAnswers = [...prev];
          newAnswers[existingIndex] = data;
          return newAnswers;
        }
        return [...prev, data];
      });
      setError(null);
    },
    onError: (error: Error) => {
      setError(`Failed to save answer: ${error.message}`);
      console.error("Answer save error:", error);
    },
  });

  // Fetch existing session if available
  useEffect(() => {
    const fetchExistingSession = async () => {
      if (!isSignedIn || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = await session?.getToken();
        if (!token) {
          throw new Error("Failed to get authentication token");
        }

        const response = await fetch("/api/sessions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const sessions = await response.json();
        const incompleteSession = sessions.find((s: any) => !s.completedAt);

        if (incompleteSession) {
          setSessionId(incompleteSession.id);

          const answersResponse = await fetch(
            `/api/sessions/${incompleteSession.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!answersResponse.ok) {
            throw new Error(`HTTP error! status: ${answersResponse.status}`);
          }

          const data = await answersResponse.json();
          setAnswers(data.answers || []);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to fetch session: ${message}`);
        console.error("Session fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingSession();
  }, [isSignedIn, user, session]);

  // Create a new session
  const createSession = async () => {
    if (!isSignedIn || !user) {
      throw new Error("User must be logged in");
    }
    return createSessionMutation.mutateAsync();
  };

  // Save an answer
  const saveAnswer = async (questionId: number, value: string) => {
    if (!isSignedIn || !user) {
      throw new Error("User must be logged in");
    }
    return saveAnswerMutation.mutateAsync({ questionId, value });
  };

  // Get all answers for the current session
  const getSessionAnswers = async (): Promise<Answer[]> => {
    if (!sessionId) return [];

    try {
      const token = await session?.getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const response = await fetch(`/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.answers || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to fetch answers: ${message}`);
      console.error("Answers fetch error:", error);
      return [];
    }
  };

  return {
    sessionId,
    answers,
    isLoading,
    error,
    createSession,
    saveAnswer,
    getSessionAnswers,
  };
}
