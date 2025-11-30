import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'metallic';
}

export const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  let colorStyles = "";
  
  if (variant === 'primary') {
    colorStyles = "bg-gradient-to-br from-[#4F46E5] to-[#4338CA] border-[#6366F1] text-white hover:from-[#4338CA] hover:to-[#3730A3] shadow-lg shadow-[#4F46E5]/30";
  } else if (variant === 'danger') {
    colorStyles = "bg-gradient-to-br from-[#DC2626] to-[#B91C1C] border-[#EF4444] text-white hover:from-[#B91C1C] hover:to-[#991B1B] shadow-lg shadow-[#DC2626]/30";
  } else if (variant === 'metallic') {
    colorStyles = "bg-gradient-to-br from-[#6B7280] to-[#4B5563] border-[#9CA3AF] text-white hover:from-[#4B5563] hover:to-[#374151] shadow-lg shadow-black/30";
  } else {
    colorStyles = "bg-gradient-to-br from-[#374151] to-[#1F2937] border-[#4B5563] text-gray-200 hover:from-[#1F2937] hover:to-[#111827] shadow-lg shadow-black/30";
  }

  return (
    <button 
      className={`
        relative px-3 py-2 font-pixel text-xs sm:text-sm uppercase 
        rounded-lg
        border-2
        active:scale-95
        transition-all duration-150
        flex items-center justify-center
        min-w-0
        break-words
        text-center
        leading-tight
        ${colorStyles} 
        ${className}
      `} 
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto',
      }}
      {...props}
    >
      {children}
    </button>
  );
};