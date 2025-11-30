import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../utils/database';
import { apiClient, User } from '../utils/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await db.init();
        const savedUserId = await db.getSetting('userId');
        if (savedUserId) {
          const userId = parseInt(savedUserId, 10);
          
          const serverUser = await apiClient.getUserById(userId);
          if (serverUser) {
            setUser({
              id: serverUser.userId,
              username: serverUser.username,
              playerId: serverUser.playerId,
            });
            
            await db.setSetting('userId', serverUser.userId.toString());
            await db.setSetting('playerId', serverUser.playerId);
            await db.setSetting('playerName', serverUser.username);
          } else {
            await db.setSetting('userId', '');
            await db.setSetting('playerId', '');
            await db.setSetting('playerName', 'Guest');
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password);
    
    setUser({
      id: result.userId,
      username: result.username,
      playerId: result.playerId,
    });
    
    await db.setSetting('userId', result.userId.toString());
    await db.setSetting('playerId', result.playerId);
    await db.setSetting('playerName', result.username);
  };

  const register = async (username: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const result = await apiClient.register(username.trim(), password);
    
    setUser({
      id: result.userId,
      username: result.username,
      playerId: result.playerId,
    });
    
    await db.setSetting('userId', result.userId.toString());
    await db.setSetting('playerId', result.playerId);
    await db.setSetting('playerName', result.username);
  };

  const logout = () => {
    setUser(null);
    db.setSetting('userId', '');
    db.setSetting('playerId', '');
    db.setSetting('playerName', 'Guest');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
