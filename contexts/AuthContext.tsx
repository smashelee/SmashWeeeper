import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsClient, setUserId } from '../utils/settingsClient';
import { apiClient, User } from '../utils/apiClient';

const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8080';
    } else if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
      return `http://${host}:8080`;
    } else {
      return 'https://smashweeper-backend-latest.onrender.com';
    }
  }
  return 'https://smashweeper-backend-latest.onrender.com';
};

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
        let savedUserId: number | null = null;
        if (typeof window !== 'undefined') {
          try {
            const localUserId = localStorage.getItem('userId');
            if (localUserId) {
              const userId = parseInt(localUserId, 10);
              if (!isNaN(userId)) {
                savedUserId = userId;
                setUserId(userId);
              }
            }
          } catch (error) {
            console.warn('Failed to load userId from localStorage:', error);
          }
        }
        
        if (savedUserId) {
          const serverUser = await apiClient.getUserById(savedUserId);
          if (serverUser) {
            setUser({
              id: serverUser.userId,
              username: serverUser.username,
              playerId: serverUser.playerId,
            });
            setUserId(serverUser.userId);
            
            await settingsClient.setSetting('userId', serverUser.userId.toString());
            await settingsClient.setSetting('playerId', serverUser.playerId);
            await settingsClient.setSetting('playerName', serverUser.username);
          } else {
            setUser(null);
            setUserId(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userId');
            }
            await settingsClient.setSetting('userId', '');
            await settingsClient.setSetting('playerId', '');
            await settingsClient.setSetting('playerName', 'Guest');
          }
        } else {
          const API_URL = getApiUrl();
          const tempUrl = new URL(`${API_URL}/api/settings/userId`);
          const tempResponse = await fetch(tempUrl.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          let dbUserId: string | null = null;
          if (tempResponse.ok) {
            const tempData = await tempResponse.json();
            dbUserId = tempData.value || null;
          }
          
          if (dbUserId) {
            const userId = parseInt(dbUserId, 10);
            if (!isNaN(userId)) {
              setUserId(userId);
              const serverUser = await apiClient.getUserById(userId);
              if (serverUser) {
                setUser({
                  id: serverUser.userId,
                  username: serverUser.username,
                  playerId: serverUser.playerId,
                });
                setUserId(serverUser.userId);
              } else {
                setUserId(null);
              }
            } else {
              setUserId(null);
            }
          } else {
            setUserId(null);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUserId(null);
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
    setUserId(result.userId);
    
    await settingsClient.setSetting('userId', result.userId.toString());
    await settingsClient.setSetting('playerId', result.playerId);
    await settingsClient.setSetting('playerName', result.username);
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
    setUserId(result.userId);
    
    await settingsClient.setSetting('userId', result.userId.toString());
    await settingsClient.setSetting('playerId', result.playerId);
    await settingsClient.setSetting('playerName', result.username);
  };

  const logout = () => {
    setUser(null);
    setUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userId');
    }
    settingsClient.setSetting('userId', '');
    settingsClient.setSetting('playerId', '');
    settingsClient.setSetting('playerName', 'Guest');
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
