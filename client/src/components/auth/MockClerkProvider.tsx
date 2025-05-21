import React, { createContext, useContext } from 'react';

// Create a mock user context
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UserContextType {
  isSignedIn: boolean;
  user: User | null;
  signIn: () => void;
  signOut: () => void;
}

const defaultUser: User = {
  id: 'dev-user-123',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
};

const UserContext = createContext<UserContextType>({
  isSignedIn: true,
  user: defaultUser,
  signIn: () => {},
  signOut: () => {},
});

export const useUser = () => useContext(UserContext);

export function MockClerkProvider({ children }: { children: React.ReactNode }) {
  // In development mode, always return a signed-in user
  const value = {
    isSignedIn: true,
    user: defaultUser,
    signIn: () => {},
    signOut: () => {},
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}