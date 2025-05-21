import { createContext, useContext } from "react";

// Define a simplified user interface without authentication
export interface AuthUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  emailAddresses: { emailAddress: string }[];
}

// Create a simplified context without authentication
export interface AuthContextType {
  isSignedIn: boolean;
  user: AuthUser | null;
  signIn: () => void;
  signOut: () => void;
}

// Default user that is always signed in
const defaultUser: AuthUser = {
  id: "default-user",
  fullName: "Test User",
  firstName: "Test",
  lastName: "User",
  emailAddresses: [{ emailAddress: "test@example.com" }]
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isSignedIn: true,
  user: defaultUser,
  signIn: () => {},
  signOut: () => {}
});

// Simplified hook for accessing user data
export function useUser() {
  return useContext(AuthContext);
}

// Simplified provider that always provides a signed-in user
export function ClerkProvider({ children }: { children: React.ReactNode }) {
  // No need for state management since we're always "signed in"
  const authValue = {
    isSignedIn: true,
    user: defaultUser,
    signIn: () => {}, // No-op function
    signOut: () => {}  // No-op function
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
