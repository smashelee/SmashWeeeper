import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 2000 }) => {
  useEffect(() => {
    if (isVisible && message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, message, duration, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-2 border-[#4a3a27] px-6 py-3 rounded-lg shadow-2xl">
        <p className="text-sm font-pixel text-[#f4e8c1] text-center">{message}</p>
      </div>
    </div>
  );
};