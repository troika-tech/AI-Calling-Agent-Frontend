import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData.user);
      } catch (error) {
        // User is not authenticated, which is fine
        // Don't log error to console - it's expected behavior
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Add a method to handle session expiration
  const handleSessionExpired = () => {
    setUser(null);
    // Clear any stored data and redirect to login
    localStorage.clear();
    window.location.href = '/';
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { user: userData } = response;
      
      // The backend uses HTTP-only cookies for authentication
      // No need to store tokens in localStorage
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    // The backend handles logout via HTTP-only cookies
    // Just clear the user state
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    handleSessionExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
