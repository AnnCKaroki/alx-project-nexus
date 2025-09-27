'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '@/types';
import apiClient from '@/lib/api';

// Complete authentication state for the entire application
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// All possible authentication state transitions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Public interface for consuming authentication functionality
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Safe defaults prevent undefined state during initial render
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Predictable state transitions for authentication flow
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore user session from stored tokens on app initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const user = await apiClient.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        // Handle expired tokens by clearing them and showing unauthenticated state
        console.warn('Failed to get current user:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Authenticate user and persist session across browser refreshes
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.login(credentials);
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Login failed. Please check your credentials.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Create new user account with immediate authentication
  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiClient.register(userData);
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Registration failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Clean logout with server notification and local state cleanup
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn('Server logout failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Sync user data changes without full re-authentication
  const refreshUser = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const user = await apiClient.getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
      }
    } catch (error) {
      console.warn('Failed to refresh user:', error);
      // Don't logout automatically on refresh failure
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Centralized hook for all authentication operations
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Quick authentication status without full auth state
export function useIsAuthenticated(): boolean {
  const { state } = useAuth();
  return state.isAuthenticated;
}

// Direct access to current user data without auth state overhead
export function useCurrentUser(): User | null {
  const { state } = useAuth();
  return state.user;
}
