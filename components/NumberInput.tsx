import React from 'react';

interface NumberInputProps {
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  name,
  value,
  onChange,
  min,
  max,
  className = '',
}) => {
  const handleIncrement = () => {
    const newValue = max !== undefined ? Math.min(value + 1, max) : value + 1;
    onChange(name, newValue);
  };

  const handleDecrement = () => {
    const newValue = min !== undefined ? Math.max(value - 1, min) : value - 1;
    onChange(name, newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value) || 0;
    let newValue = numValue;
    if (min !== undefined) newValue = Math.max(newValue, min);
    if (max !== undefined) newValue = Math.min(newValue, max);
    onChange(name, newValue);
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={min !== undefined && value <= min}
        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gradient-to-br from-[#3a2817] to-[#2a1810] hover:from-[#2a1810] hover:to-[#1a0f08] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#4a3a27] rounded-lg text-[#f4e8c1] transition-all duration-150 active:scale-90 flex-shrink-0 shadow-inner"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <input
        type="number"
        name={name}
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-14 sm:w-16 md:w-20 bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] p-1 sm:p-1.5 sm:p-2 text-center focus:outline-none focus:border-[#7cb342] font-pixel text-[#f4e8c1] rounded-lg text-[10px] sm:text-xs md:text-sm shadow-inner"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gradient-to-br from-[#3a2817] to-[#2a1810] hover:from-[#2a1810] hover:to-[#1a0f08] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#4a3a27] rounded-lg text-[#f4e8c1] transition-all duration-150 active:scale-90 flex-shrink-0 shadow-inner"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2L6 10M2 6L10 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};