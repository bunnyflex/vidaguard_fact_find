import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Add Clerk types
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<T> {
  try {
    // Get the session token from Clerk
    if (!window.Clerk) {
      console.error("Clerk is not initialized");
      throw new Error("Authentication not initialized");
    }

    if (!window.Clerk.session) {
      console.error("No active Clerk session");
      throw new Error("No active session");
    }

    const token = await window.Clerk.session.getToken();
    if (!token) {
      console.error("Failed to get Clerk session token");
      throw new Error("No authentication token available");
    }

    console.log(
      "Making API request to:",
      url,
      "with token:",
      token.substring(0, 10) + "..."
    );
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API request failed:", {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
      });
      throw new Error(`${res.status}: ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Get the session token from Clerk
      if (!window.Clerk) {
        console.error("Clerk is not initialized");
        throw new Error("Authentication not initialized");
      }

      if (!window.Clerk.session) {
        console.error("No active Clerk session");
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("No active session");
      }

      const token = await window.Clerk.session.getToken();
      if (!token) {
        console.error("Failed to get Clerk session token");
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        throw new Error("No authentication token available");
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query failed:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
