"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, storage, User } from "@/lib/api";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = storage.getToken();
    if (stored) {
      setTokenState(stored);
    }
    setIsInitialized(true);
  }, []);

  // Fetch user data with TanStack Query
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", token],
    queryFn: () => getCurrentUser(token!),
    enabled: !!token && isInitialized,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const setToken = (newToken: string | null) => {
    if (newToken) {
      storage.setToken(newToken);
    } else {
      storage.removeToken();
    }
    setTokenState(newToken);
  };

  const logout = () => {
    storage.removeToken();
    setTokenState(null);
    queryClient.clear(); // Clear all queries
  };

  const isLoading = !isInitialized || (isInitialized && token && isLoadingUser);

  return (
    <AuthContext.Provider
      value={{
        token,
        user: user || null,
        isLoading: isLoading || false,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
