import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Optionally verify token by calling /auth/me
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (authToken) => {
    try {
      // First check basic auth
      const authResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (authResponse.ok) {
        const userData = await authResponse.json();
        setUser(userData);

        // Now check if user has a profile
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (profileResponse.status === 404) {
          // User is authenticated but has no profile - needs onboarding
          setNeedsOnboarding(true);
        } else if (profileResponse.ok) {
          // User has profile, no onboarding needed
          setNeedsOnboarding(false);
        }
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error('Failed to verify token:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (authToken) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    verifyToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setNeedsOnboarding(false);
  };

  const value = {
    token,
    user,
    needsOnboarding,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
