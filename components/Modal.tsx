import React from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  showXButton?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, showCloseButton = true, showXButton = true, maxWidth = 'sm' }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }[maxWidth];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-1.5 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-gradient-to-br from-[#8b6f47] to-[#6b4423] p-0.5 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-2xl w-full ${maxWidthClass} border border-[#a0826d]/20 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] p-2.5 sm:p-4 md:p-6 border-2 border-[#4a3a27]/50 rounded-lg sm:rounded-xl flex flex-col shadow-inner min-h-0">
          <div className="flex justify-between items-center mb-2 sm:mb-4 border-b-2 border-[#4a3a27]/50 pb-1.5 sm:pb-3">
            <h3 className="text-sm sm:text-lg md:text-xl text-[#f4e8c1] font-pixel uppercase tracking-wider pr-2">{title}</h3>
            {showXButton && (
              <button
                onClick={onClose}
                className="text-[#c5a572] hover:text-white transition-all duration-200 p-1 sm:p-1.5 rounded-lg hover:bg-[#6b4423]/50 active:scale-90 flex-shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="text-[#f4e8c1] text-xs sm:text-sm leading-relaxed">
            {children}
          </div>
          {showCloseButton && (
            <div className="flex justify-center mt-4 sm:mt-6">
              <PixelButton onClick={onClose} variant="primary" className="shadow-lg text-[10px] sm:text-xs px-3 sm:px-3 py-2 sm:py-2.5">{t.modal.close}</PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};