import React, { useState, useEffect, useMemo } from 'react';
import { PixelButton } from './PixelButton';
import { NumberInput } from './NumberInput';
import { GameConfig, GameMode, PatternId } from '../types';
import { MAX_ROWS, MAX_COLS, MIN_ROWS, MIN_COLS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { getMultiplayerGameModes } from '../utils/gameModes';
import { getModeNameFromTranslation } from '../utils/gameModes/i18nHelpers';
import { getAllPatterns } from '../utils/patterns/patternHelpers';
import { getPatternNameFromTranslation } from '../utils/patterns/patternHelpers';

interface CreateRoomProps {
  onBack: () => void;
  onCreate: (config: GameConfig) => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ onBack, onCreate }) => {
  const { t } = useLanguage();
  const availableModes = useMemo(() => getMultiplayerGameModes(), []);
  const defaultMode = availableModes.length > 0 ? (availableModes[0].metadata.id as GameMode) : 'classic';
  const availablePatterns = useMemo(() => getAllPatterns(), []);
  const defaultPattern: PatternId = 'default';
  const [localConfig, setLocalConfig] = useState<GameConfig>({ rows: 9, cols: 9, mines: 10, gameMode: defaultMode, pattern: defaultPattern });
  const [showModeError, setShowModeError] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameConfig');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLocalConfig({ ...parsed, gameMode: parsed.gameMode || 'classic', pattern: defaultPattern });
        } catch (e) {
          console.error('Failed to parse saved game config', e);
        }
      }
    } catch (error) {
      console.error('Failed to load game config:', error);
    }
  }, []);

  const handleNumberChange = (name: string, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAndCreate = () => {
    if (!localConfig.gameMode) {
      setShowModeError(true);
      setTimeout(() => setShowModeError(false), 3000);
      return;
    }

    setShowModeError(false);
    let { rows, cols, mines, gameMode } = localConfig;
    
    rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows));
    cols = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
    
    const maxMines = Math.floor((rows * cols) * 0.85);
    mines = Math.max(1, Math.min(maxMines, mines));

    const validatedConfig = { rows, cols, mines, gameMode: gameMode || 'classic', pattern: localConfig.pattern || defaultPattern };

    onCreate(validatedConfig);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-5 md:gap-6 w-full">
      <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-lg sm:rounded-xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.modal.gameMode}</div>
        
        <div className="flex gap-1.5 sm:gap-3">
          {availableModes.map(({ mode, metadata }) => (
            <PixelButton
              key={metadata.id}
              onClick={() => {
                setLocalConfig(prev => ({ ...prev, gameMode: metadata.id as GameMode }));
                setShowModeError(false);
              }}
              variant={localConfig.gameMode === metadata.id ? 'primary' : 'secondary'}
              className="flex-1 min-w-0 text-[9px] sm:text-xs px-1.5 sm:px-4 py-1.5 sm:py-2.5"
            >
              {getModeNameFromTranslation(metadata.translationKey, t)}
            </PixelButton>
          ))}
        </div>
        {showModeError && (
          <div className="mt-2 bg-gradient-to-br from-[#d84315]/20 to-[#bf360c]/20 border-2 border-[#d84315]/50 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs font-pixel text-[#ff5722] text-center">
              {t.modal.selectGameMode}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-lg sm:rounded-xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.modal.pattern}</div>
        
        <div className="flex gap-1.5 sm:gap-3">
          {availablePatterns.map(({ pattern, metadata }) => (
            <PixelButton
              key={metadata.id}
              onClick={() => {
                setLocalConfig(prev => ({ ...prev, pattern: metadata.id as PatternId }));
              }}
              variant={localConfig.pattern === metadata.id ? 'primary' : 'secondary'}
              className="flex-1 min-w-0 text-[9px] sm:text-xs px-1.5 sm:px-4 py-1.5 sm:py-2.5"
            >
              {getPatternNameFromTranslation(metadata.translationKey, t)}
            </PixelButton>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-lg sm:rounded-xl p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.modal.fieldSettings}</div>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel">{t.settings.rows}</label>
              <div className="text-[10px] sm:text-xs text-[#8b6f47] font-pixel">({MIN_ROWS}-{MAX_ROWS})</div>
            </div>
            <div className="flex-shrink-0">
              <NumberInput
                name="rows"
                value={localConfig.rows}
                onChange={handleNumberChange}
                min={MIN_ROWS}
                max={MAX_ROWS}
              />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#6b4423] to-transparent"></div>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel">{t.settings.cols}</label>
              <div className="text-[10px] sm:text-xs text-[#8b6f47] font-pixel">({MIN_COLS}-{MAX_COLS})</div>
            </div>
            <div className="flex-shrink-0">
              <NumberInput
                name="cols"
                value={localConfig.cols}
                onChange={handleNumberChange}
                min={MIN_COLS}
                max={MAX_COLS}
              />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#6b4423] to-transparent"></div>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel">{t.settings.mines}</label>
              <div className="text-[10px] sm:text-xs text-[#8b6f47] font-pixel">max: {Math.floor((localConfig.rows * localConfig.cols) * 0.85)}</div>
            </div>
            <div className="flex-shrink-0">
              <NumberInput
                name="mines"
                value={localConfig.mines}
                onChange={handleNumberChange}
                min={1}
                max={Math.floor((localConfig.rows * localConfig.cols) * 0.85)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 w-full mt-auto pt-4 sm:pt-6">
        <PixelButton onClick={onBack} variant="secondary" className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5">
          {t.settings.back}
        </PixelButton>
        <PixelButton onClick={validateAndCreate} className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5">
          {t.modal.createRoom}
        </PixelButton>
      </div>
    </div>
  );
};