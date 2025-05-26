import { useClerk } from "@clerk/clerk-react";
import { useCallback } from "react";

// Base API configuration
const API_BASE = "/api";

// Custom hook for authenticated API requests
export function useApi() {
  const { session } = useClerk();

  const apiRequest = useCallback(
    async (method: string, endpoint: string, data?: any) => {
      try {
        const token = await session?.getToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || response.statusText);
        }

        if (response.status === 204) {
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
      }
    },
    [session]
  );

  return {
    // Sessions
    getSessions: () => apiRequest("GET", "/sessions"),
    getSession: (id: number) => apiRequest("GET", `/sessions/${id}`),
    createSession: (data: any) => apiRequest("POST", "/sessions", data),
    updateSession: (id: number, data: any) =>
      apiRequest("PUT", `/sessions/${id}`, data),

    // Answers
    createAnswer: (sessionId: number, data: any) =>
      apiRequest("POST", `/sessions/${sessionId}/answers`, data),

    // User
    getMe: () => apiRequest("GET", "/me"),
    createUser: (data: any) => apiRequest("POST", "/users", data),

    // Export
    generatePDF: (sessionId: number) =>
      apiRequest("POST", `/sessions/${sessionId}/pdf`),
    generateExcel: (sessionId: number) =>
      apiRequest("GET", `/sessions/${sessionId}/excel`),
  };
}
