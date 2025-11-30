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

let currentUserId: number | null = null;

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('userId');
    if (saved) {
      const userId = parseInt(saved, 10);
      if (!isNaN(userId)) {
        currentUserId = userId;
      }
    }
  } catch (error) {
    console.warn('Failed to load userId from localStorage:', error);
  }
}

export const setUserId = (userId: number | null): void => {
  currentUserId = userId;
  
  if (typeof window !== 'undefined') {
    try {
      if (userId !== null) {
        localStorage.setItem('userId', userId.toString());
      } else {
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.warn('Failed to save userId to localStorage:', error);
    }
  }
};

export const getUserId = (): number | null => {
  return currentUserId;
};

export const settingsClient = {
  async getSetting(key: string): Promise<string | null> {
    try {
      const url = new URL(`${API_URL}/api/settings/${key}`);
      if (currentUserId) {
        url.searchParams.append('userId', currentUserId.toString());
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to get setting');
      }

      const data = await response.json();
      return data.value || null;
    } catch (error: any) {
      console.warn(`Failed to get setting ${key}:`, error);
      return null;
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/settings/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, userId: currentUserId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set setting');
      }
    } catch (error: any) {
      console.warn(`Failed to set setting ${key}:`, error);
      throw error;
    }
  },

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const url = new URL(`${API_URL}/api/settings`);
      if (currentUserId) {
        url.searchParams.append('userId', currentUserId.toString());
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get settings');
      }

      const data = await response.json();
      return data.settings || {};
    } catch (error: any) {
      console.warn('Failed to get all settings:', error);
      return {};
    }
  },
};