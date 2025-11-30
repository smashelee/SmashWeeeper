import React from 'react';
import { PixelButton } from './PixelButton';

interface ModalConfig {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary' | 'metallic';
  }>;
}

export const createModal = ({ title, children, onClose, buttons }: ModalConfig) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#9CA3AF] p-1 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="bg-[#374151] p-6 border-2 border-[#1F2937] rounded-lg flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b-2 border-gray-700 pb-2">
            <h3 className="text-xl text-[#D1D5DB]">{title}</h3>
          </div>
          <div className="text-gray-300 text-sm leading-relaxed mb-6">
            {children}
          </div>
          <div className="flex justify-end gap-2">
            {buttons ? (
              buttons.map((button, index) => (
                <PixelButton 
                  key={index}
                  onClick={button.onClick} 
                  variant={button.variant || 'primary'}
                >
                  {button.label}
                </PixelButton>
              ))
            ) : (
              <PixelButton onClick={onClose} variant="primary">Close</PixelButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

