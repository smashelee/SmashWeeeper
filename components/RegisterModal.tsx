import React, { useState } from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { validateUsername, filterLatinInput } from '../utils/validation';

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || t.auth.usernameRequired || 'Username is required');
      return;
    }

    if (!password) {
      setError(t.auth.passwordRequired || 'Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsNotMatch || 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), password, confirmPassword);
      onSuccess();
      onClose();
    } catch (err: any) {
      let errorMessage = err.message || t.auth.registerFailed || 'Registration failed';
      if (err.message === 'Username already exists') {
        errorMessage = t.auth.usernameExists || 'Username already exists';
      } else if (err.message === 'Passwords do not match') {
        errorMessage = t.auth.passwordsNotMatch || 'Passwords do not match';
      } else if (err.message === 'Username must be between 3 and 20 characters') {
        errorMessage = t.auth.usernameRequired || 'Username is required';
      } else if (err.message === 'Password must be at least 4 characters') {
        errorMessage = t.auth.passwordRequired || 'Password is required';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm text-gray-300 font-pixel">{t.auth.username || 'Username'}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const filtered = filterLatinInput(e.target.value);
              setUsername(filtered);
            }}
            maxLength={20}
            className="w-full bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#6366F1]"
            placeholder={t.auth.username || 'Username'}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm text-gray-300 font-pixel">{t.auth.password || 'Password'}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#6366F1]"
            placeholder={t.auth.password || 'Password'}
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm text-gray-300 font-pixel">{t.auth.confirmPassword || 'Confirm Password'}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#6366F1]"
            placeholder={t.auth.confirmPassword || 'Confirm Password'}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleRegister();
              }
            }}
          />
        </div>

        {error && (
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs font-pixel text-red-400 text-center">{error}</p>
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
          onClick={handleRegister} 
          className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0"
          disabled={loading}
        >
          {t.auth.register || 'Register'}
        </PixelButton>
      </div>
    </div>
  );
};