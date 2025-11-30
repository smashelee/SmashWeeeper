import React, { useState, useEffect, useRef } from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { socketClient } from '../utils/socketClient';

interface JoinRoomProps {
  onBack: () => void;
  onJoin: (roomCode: string) => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ onBack, onJoin }) => {
  const { t } = useLanguage();
  const [roomCode, setRoomCode] = useState('');
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const roomCodeRef = useRef(roomCode);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    const handleRoomCheck = (data: { roomCode: string; exists: boolean }) => {
      const currentCode = roomCodeRef.current.trim().toUpperCase();
      console.log('room_check_result received:', data, 'current code:', currentCode);
      if (data.roomCode === currentCode) {
        console.log('Setting roomExists to:', data.exists);
        setRoomExists(data.exists);
      } else {
        console.log('Code mismatch! Received:', data.roomCode, 'Expected:', currentCode);
      }
    };

    socketClient.on('room_check_result', handleRoomCheck);
    console.log('Subscribed to room_check_result');

    return () => {
      socketClient.off('room_check_result', handleRoomCheck);
    };
  }, []);

  useEffect(() => {
    const trimmedCode = roomCode.trim();
    if (trimmedCode.length === 5) {
      if (!socketClient.isConnected()) {
        console.log('Socket not connected, cannot check room');
        setRoomExists(false);
        return;
      }
      setRoomExists(null);
      const currentCode = trimmedCode.toUpperCase();
      console.log('Checking room:', currentCode, 'Socket connected:', socketClient.isConnected());
      const checkTimeout = setTimeout(() => {
        console.log('Emitting check_room for:', currentCode);
        socketClient.emit('check_room', { roomCode: currentCode });
      }, 300);

      return () => clearTimeout(checkTimeout);
    } else if (trimmedCode.length < 5) {
      setRoomExists(null);
    }
  }, [roomCode]);

  const handleConnect = () => {
    if (roomCode.trim().length === 5 && roomExists === true) {
      onJoin(roomCode.trim().toUpperCase());
    }
  };

  const getButtonText = () => {
    const trimmedCode = roomCode.trim();
    if (trimmedCode.length !== 5) {
      return t.modal.bruh;
    }
    if (roomExists === null) {
      return t.modal.waiting;
    }
    if (roomExists === false) {
      return t.modal.error;
    }
    return t.modal.connect;
  };

  const isButtonDisabled = () => {
    const trimmedCode = roomCode.trim();
    return trimmedCode.length !== 5 || roomExists === null || roomExists === false;
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 md:gap-6 w-full">
      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-3 sm:p-5 md:p-6">
        <div className="text-center mb-2.5 sm:mb-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-lg">
          <i className="fi fi-br-lock text-white text-base sm:text-xl md:text-2xl"></i>
          </div>
          <label className="text-[10px] sm:text-sm text-gray-300 font-pixel uppercase tracking-wider">{t.modal.enterCode}</label>
        </div>
        
        <div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="*****"
            maxLength={5}
            className="w-full bg-gradient-to-br from-[#1F2937] to-[#111827] border-2 border-[#4B5563] px-2.5 sm:px-4 md:px-6 py-2.5 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-pixel text-base sm:text-xl md:text-2xl text-center text-[#60A5FA] tracking-[0.15em] sm:tracking-[0.3em] focus:outline-none focus:border-[#6366F1] focus:shadow-lg focus:shadow-[#6366F1]/20 uppercase transition-all duration-200"
          />
          {roomCode.trim().length > 0 && (
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-3">
              {roomCode.trim().length === 5 ? (
                roomExists === null ? (
                  <>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-500"></div>
                    <span className="text-[10px] sm:text-xs text-gray-400 font-pixel">{t.modal.waiting}</span>
                  </>
                ) : roomExists === true ? (
                  <>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-[10px] sm:text-xs text-green-400 font-pixel">{t.modal.activeRoom}</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-pulse"></div>
                    <span className="text-[10px] sm:text-xs text-red-400 font-pixel">{t.modal.notFound}</span>
                  </>
                )
              ) : (
                <>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-500"></div>
                  <span className="text-[10px] sm:text-xs text-gray-400 font-pixel">{t.modal.codeIncomplete}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 w-full mt-auto pt-4 sm:pt-6">
        <PixelButton onClick={onBack} variant="secondary" className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5">
          {t.settings.back}
        </PixelButton>
        <PixelButton 
          onClick={handleConnect} 
          className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5"
          disabled={isButtonDisabled()}
          variant={roomExists === false || roomCode.trim().length !== 5 ? 'secondary' : 'primary'}
        >
          {getButtonText()}
        </PixelButton>
      </div>
    </div>
  );
};