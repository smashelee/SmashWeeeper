import React, { useState } from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { filterLatinInput } from '../utils/validation';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!username.trim()) {
      setError(t.auth.usernameRequired || 'Username is required');
      return;
    }

    if (!password) {
      setError(t.auth.passwordRequired || 'Password is required');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel">{t.auth.username || 'Username'}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const filtered = filterLatinInput(e.target.value);
              setUsername(filtered);
            }}
            className="w-full bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-[#f4e8c1] placeholder:text-[#9ccc65] focus:outline-none focus:border-[#7cb342]"
            placeholder={t.auth.username || 'Username'}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel">{t.auth.password || 'Password'}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-[#f4e8c1] placeholder:text-[#9ccc65] focus:outline-none focus:border-[#7cb342]"
            placeholder={t.auth.password || 'Password'}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleLogin();
              }
            }}
          />
        </div>

        {error && (
          <div className="bg-gradient-to-br from-[#d84315]/20 to-[#bf360c]/20 border-2 border-[#d84315]/50 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs font-pixel text-[#ff5722] text-center">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 sm:gap-3 w-full min-w-0">
        <PixelButton 
          onClick={onClose} 
          variant="secondary" 
          className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0"
          disabled={loading}
        >
          {t.modal.cancel}
        </PixelButton>
        <PixelButton 
          onClick={handleLogin} 
          className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0"
          disabled={loading}
        >
          {t.auth.login || 'Login'}
        </PixelButton>
      </div>
    </div>
  );
};