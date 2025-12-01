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
    colorStyles = "bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-[#9ccc65] text-white hover:from-[#558b2f] hover:to-[#33691e] shadow-lg shadow-[#7cb342]/30";
  } else if (variant === 'danger') {
    colorStyles = "bg-gradient-to-br from-[#d84315] to-[#bf360c] border-[#ff5722] text-white hover:from-[#bf360c] hover:to-[#8b2500] shadow-lg shadow-[#d84315]/30";
  } else if (variant === 'metallic') {
    colorStyles = "bg-gradient-to-br from-[#8b6f47] to-[#6b4423] border-[#a0826d] text-white hover:from-[#6b4423] hover:to-[#4a2f1a] shadow-lg shadow-black/30";
  } else {
    colorStyles = "bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-[#6d5a3f] text-[#f4e8c1] hover:from-[#3a2817] hover:to-[#2a1810] shadow-lg shadow-black/30";
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