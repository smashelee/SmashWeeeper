import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MultiplayerModeSelectProps {
  onSelectHost: () => void;
  onSelectPlayer: () => void;
  onClose: () => void;
}

export const MultiplayerModeSelect: React.FC<MultiplayerModeSelectProps> = ({
  onSelectHost,
  onSelectPlayer,
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      <div className="text-center mb-1 sm:mb-2">
        <p className="text-xs sm:text-sm text-gray-400 font-pixel uppercase tracking-wider mb-1">{t.modal.selectMode}</p>
        <div className="h-0.5 w-12 sm:w-16 bg-gradient-to-r from-transparent via-[#4B5563] to-transparent mx-auto"></div>
      </div>
      
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={onSelectHost}
          className="group relative flex-1 bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-2.5 sm:p-3 hover:border-[#6366F1] transition-all duration-200 hover:shadow-lg hover:shadow-[#6366F1]/20"
        >
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/50 flex items-center justify-center shadow-lg">
              <i className="fi fi-br-crown text-purple-400 text-sm sm:text-base"></i>
            </div>
            <div className="text-xs sm:text-sm font-pixel text-white">{t.modal.host}</div>
            <div className="text-[9px] sm:text-[10px] text-gray-400 font-pixel">{t.modal.createRoomDesc}</div>
          </div>
        </button>

        <button
          onClick={onSelectPlayer}
          className="group relative flex-1 bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-2.5 sm:p-3 hover:border-[#6366F1] transition-all duration-200 hover:shadow-lg hover:shadow-[#6366F1]/20"
        >
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/50 flex items-center justify-center shadow-lg">
              <i className="fi fi-br-sign-in-alt text-blue-400 text-sm sm:text-base"></i>
            </div>
            <div className="text-xs sm:text-sm font-pixel text-white">{t.modal.player}</div>
            <div className="text-[9px] sm:text-[10px] text-gray-400 font-pixel">{t.modal.joinRoomDesc}</div>
          </div>
        </button>
      </div>
    </div>
  );
};