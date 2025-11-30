const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__API_URL__) {
    return (window as any).__API_URL__;
  }
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8080';
    } else if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
      return `http://${host}:8080`;
    } else {
      return process.env.API_URL || 'https://smashweeper-backend-latest.onrender.com';
    }
  }
  
  return process.env.API_URL || 'https://smashweeper-backend-latest.onrender.com';
};

const API_URL = getApiUrl();

export interface User {
  id: number;
  username: string;
  playerId: string;
}

export const apiClient = {
  async register(username: string, password: string): Promise<{ userId: number; playerId: string; username: string }> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    return { userId: data.userId, playerId: data.playerId, username: data.username };
  },

  async login(username: string, password: string): Promise<{ userId: number; playerId: string; username: string }> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    return { userId: data.userId, playerId: data.playerId, username: data.username };
  },

  async getUserById(userId: number): Promise<{ userId: number; playerId: string; username: string } | null> {
    try {
      const response = await fetch(`${API_URL}/api/auth/user/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      }

      const data = await response.json();
      return { userId: data.userId, playerId: data.playerId, username: data.username };
    } catch (error: any) {
      console.error('Failed to fetch user from server:', error);
      return null;
    }
  },
};