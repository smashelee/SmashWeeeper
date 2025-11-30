import React from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { GAME_VERSION } from '../constants';

interface MainMenuProps {
  onPlay: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onMultiplayer, onSettings }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in py-6 sm:py-8 md:py-10 px-4">
      <div className="relative w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl text-center font-bold text-[#D1D5DB] drop-shadow-2xl whitespace-pre-line px-2 font-pixel">
          {t.menu.title}
        </h1>
        <div className="text-[#9CA3AF] text-[8px] sm:text-[10px] md:text-xs font-pixel mt-1 sm:mt-2 text-right px-2">
          {t.menu.by} Smashelee & Valleriiaq
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-[#9CA3AF] to-[#6B7280] p-1 sm:p-1.5 rounded-2xl shadow-2xl border border-[#D1D5DB]/20 w-full max-w-[280px] sm:max-w-[320px]">
        <div className="flex flex-col space-y-3 sm:space-y-4 w-full p-4 sm:p-5 md:p-6 bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 border-[#4B5563]/50 rounded-xl shadow-inner">
          <PixelButton onClick={onPlay} variant="primary" className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg shadow-lg w-full">
            {t.menu.play}
          </PixelButton>
          
          <PixelButton onClick={onMultiplayer} variant="metallic" className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base shadow-lg w-full">
            {t.menu.multiplayer}
          </PixelButton>
          
          <PixelButton onClick={onSettings} variant="metallic" className="flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base shadow-lg w-full">
            {t.menu.settings}
          </PixelButton>
          
        </div>
      </div>
      
      <div className="text-[#9CA3AF] text-[10px] sm:text-xs font-pixel drop-shadow-lg" style={{ marginTop: '0.5rem' }}>
        {t.menu.version}: {GAME_VERSION}
      </div>
    </div>
  );
};