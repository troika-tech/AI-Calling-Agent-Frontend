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
      
      // Redirect based on user role
      setTimeout(() => {
        switch (userData.role) {
          case 'admin':
            window.location.href = '/admin/overview';
            break;
          case 'inbound':
            window.location.href = '/inbound/dashboard';
            break;
          case 'outbound':
            window.location.href = '/outbound/dashboard';
            break;
          default:
            window.location.href = '/';
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (email, name, password) => {
    try {
      const response = await api.register(email, name, password);
      const { user: userData } = response;
      
      // The backend uses HTTP-only cookies for authentication
      // No need to store tokens in localStorage
      setUser(userData);
      
      // Redirect based on user role (new users are inbound by default)
      setTimeout(() => {
        switch (userData.role) {
          case 'admin':
            window.location.href = '/admin/overview';
            break;
          case 'inbound':
            window.location.href = '/inbound/dashboard';
            break;
          case 'outbound':
            window.location.href = '/outbound/dashboard';
            break;
          default:
            window.location.href = '/inbound/dashboard';
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    // Clear user state immediately to prevent further API calls
    setUser(null);
    
    try {
      // Call the backend logout endpoint (don't wait for response)
      api.logout().catch(() => {
        // Ignore errors - logout should always succeed locally
      });
    } catch (error) {
      // Ignore errors - continue with local cleanup
    } finally {
      // Clear local state and redirect to login
      localStorage.clear();
      // Use replace to prevent back button from going to dashboard
      window.location.replace('/');
    }
  };

  const value = {
    user,
    login,
    register,
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
