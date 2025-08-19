import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken as setPatientServiceToken } from '../services/patientService';

interface User {
  id: string;
  role: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (token: string, userData: Partial<User>, redirectPath?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Initialize auth state
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        // Validate the token by making an authenticated request
        const response = await fetch('/api/validate-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setPatientServiceToken(token);
          setIsAuthenticatedState(true);
          return;
        }
      } catch (error) {
        console.error('Error validating token:', error);
      }
      
      // If we get here, the token is invalid or validation failed
      console.log('Invalid or expired token, logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    setIsAuthenticatedState(false);
    setUser(null);
    setPatientServiceToken(null);
    setIsLoading(false);
  }, [setUser, setIsAuthenticatedState, setPatientServiceToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback((token: string, userData: Partial<User>, redirectPath: string = '/patients') => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setPatientServiceToken(token);
    setUser(userData as User);
    setIsAuthenticatedState(true);
    navigate(redirectPath);
  }, [navigate, setUser, setIsAuthenticatedState, setPatientServiceToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setPatientServiceToken(null);
    setUser(null);
    setIsAuthenticatedState(false);
    navigate('/login');
  }, [navigate, setUser, setIsAuthenticatedState, setPatientServiceToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAuthenticatedState,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
