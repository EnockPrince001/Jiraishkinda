import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type AuthResponse } from '@/lib/api-client';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
  username: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // If we can't parse, assume expired
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedEmail = localStorage.getItem('auth_email');
    const storedUsername = localStorage.getItem('auth_username');

    if (storedToken && storedEmail && storedUsername) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        // Token expired, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_email');
        localStorage.removeItem('auth_username');
      } else {
        setToken(storedToken);
        setEmail(storedEmail);
        setUsername(storedUsername);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    setToken(response.token);
    setEmail(response.email);
    setUsername(response.username);

    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_email', response.email);
    localStorage.setItem('auth_username', response.username);
  };

  const register = async (username: string, email: string, password: string) => {
    await authApi.register({ username, email, password });
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    setUsername(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_username');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        email,
        username,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

