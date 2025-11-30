import React, { useState, useMemo } from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { GameMode, PatternId } from '../types';
import { getSingleplayerGameModes } from '../utils/gameModes';
import { getModeNameFromTranslation } from '../utils/gameModes/i18nHelpers';
import { getAllPatterns } from '../utils/patterns/patternHelpers';
import { getPatternNameFromTranslation } from '../utils/patterns/patternHelpers';

interface GameModeSelectProps {
  onSelect: (gameMode: GameMode, pattern: PatternId) => void;
  onBack: () => void;
}

export const GameModeSelect: React.FC<GameModeSelectProps> = ({ onSelect, onBack }) => {
  const { t } = useLanguage();
  const availableModes = useMemo(() => getSingleplayerGameModes(), []);
  const availablePatterns = useMemo(() => getAllPatterns(), []);
  const defaultPattern: PatternId = 'default';
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    availableModes.length > 0 ? (availableModes[0].metadata.id as GameMode) : 'classic'
  );
  const [selectedPattern, setSelectedPattern] = useState<PatternId>(defaultPattern);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 md:gap-4 w-full">
      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-4 sm:p-4 md:p-3.5 space-y-4 sm:space-y-3 md:space-y-3">
        <div className="text-[10px] sm:text-xs md:text-xs text-gray-400 font-pixel uppercase mb-3 sm:mb-3 md:mb-3 text-center">{t.modal.gameMode}</div>
        
        <div className="flex gap-2 sm:gap-3 md:gap-2.5">
          {availableModes.map(({ mode, metadata }) => (
            <PixelButton
              key={metadata.id}
              onClick={() => setSelectedMode(metadata.id as GameMode)}
              variant={selectedMode === metadata.id ? 'primary' : 'secondary'}
              className="flex-1 min-w-0 text-[9px] sm:text-[10px] md:text-xs px-3 sm:px-4 md:px-2.5 py-3 sm:py-2.5 md:py-2.5"
            >
              {getModeNameFromTranslation(metadata.translationKey, t)}
            </PixelButton>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-4 sm:p-4 md:p-3.5 space-y-4 sm:space-y-3 md:space-y-3">
        <div className="text-[10px] sm:text-xs md:text-xs text-gray-400 font-pixel uppercase mb-3 sm:mb-3 md:mb-3 text-center">{t.modal.pattern}</div>
        
        <div className="flex gap-2 sm:gap-3 md:gap-2.5">
          {availablePatterns.map(({ pattern, metadata }) => (
            <PixelButton
              key={metadata.id}
              onClick={() => setSelectedPattern(metadata.id as PatternId)}
              variant={selectedPattern === metadata.id ? 'primary' : 'secondary'}
              className="flex-1 min-w-0 text-[9px] sm:text-[10px] md:text-xs px-3 sm:px-4 md:px-2.5 py-3 sm:py-2.5 md:py-2.5"
            >
              {getPatternNameFromTranslation(metadata.translationKey, t)}
            </PixelButton>
          ))}
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 md:gap-3 w-full mt-auto pt-4 sm:pt-6 md:pt-5">
        <PixelButton onClick={onBack} variant="secondary" className="flex-1 shadow-lg text-[9px] sm:text-[10px] md:text-xs px-3 sm:px-4 md:px-3 py-3 sm:py-2.5 md:py-2.5">
          {t.settings.back}
        </PixelButton>
        <PixelButton onClick={() => onSelect(selectedMode, selectedPattern)} className="flex-1 shadow-lg text-[9px] sm:text-[10px] md:text-xs px-3 sm:px-4 md:px-3 py-3 sm:py-2.5 md:py-2.5">
          {t.menu.play}
        </PixelButton>
      </div>
    </div>
  );
};