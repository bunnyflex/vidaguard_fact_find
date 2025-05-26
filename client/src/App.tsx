import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Auth from "@/pages/auth";
import { ThemeProvider } from "@/components/ui/theme-provider";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth/sign-up" component={Auth} />
      <Route path="/auth/sign-up/*" component={Auth} />
      <Route path="/auth/sign-in/*" component={Auth} />
      <Route path="/auth/verify-email-address" component={Auth} />
      <Route path="/auth/verify-email-address/*" component={Auth} />
      <Route path="/auth/reset-password" component={Auth} />
      <Route path="/auth/reset-password/*" component={Auth} />
      <Route path="/auth/sso-callback" component={Auth} />
      <Route path="/auth/sso-callback/*" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
