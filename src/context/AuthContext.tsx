import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, usersApi } from '../api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  register: (params: {
    name: string;
    email: string;
    role: 'manager' | 'member';
    department: string;
    title: string;
  }) => Promise<boolean>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    const res = await usersApi.getAll();
    if (res.success && res.data) {
      setUsers(res.data);
    }
  };

  const fetchCurrentUser = async () => {
    const res = await authApi.getCurrentUser();
    if (res.success && res.data) {
      setCurrentUser(res.data);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchCurrentUser(), fetchUsers()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const res = await authApi.login(email);
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      await fetchUsers();
      return true;
    }
    return false;
  };

  const register = async (params: {
    name: string;
    email: string;
    role: 'manager' | 'member';
    department: string;
    title: string;
  }): Promise<boolean> => {
    const res = await authApi.register(params);
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      await fetchUsers();
      return true;
    }
    return false;
  };

  const switchUser = async (userId: string) => {
    const res = await authApi.switchUser(userId);
    if (res.success && res.data?.user) {
      setCurrentUser(res.data.user);
      // Trigger user switch event
      window.dispatchEvent(new CustomEvent('taskflow_user_switched', { detail: res.data.user }));
    }
  };

  const logout = () => {
    authApi.logout();
    // Revert to first user as demo fallback
    if (users.length > 0) {
      switchUser(users[0].id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        login,
        register,
        switchUser,
        logout,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
