import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminContextType {
  isAuthenticated: boolean;
  isAdminVisible: boolean;
  showAdminLogin: () => void;
  hideAdmin: () => void;
  login: (authenticated: boolean) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Session key for admin auth (not cached publicly)
const ADMIN_SESSION_KEY = 'biodata_admin_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  // Check session on mount
  useEffect(() => {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      const { timestamp } = JSON.parse(session);
      if (Date.now() - timestamp < SESSION_DURATION) {
        setIsAuthenticated(true);
        setIsAdminVisible(true);
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  }, []);

  const showAdminLogin = () => {
    setIsAdminVisible(true);
  };

  const hideAdmin = () => {
    setIsAdminVisible(false);
    setIsAuthenticated(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const login = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (authenticated) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
        timestamp: Date.now()
      }));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdminVisible(false);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      isAdminVisible,
      showAdminLogin,
      hideAdmin,
      login,
      logout
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
