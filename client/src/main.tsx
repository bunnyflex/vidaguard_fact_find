import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@/components/auth/ClerkProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Clerk Publishable Key - Please set VITE_CLERK_PUBLISHABLE_KEY in your environment"
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
