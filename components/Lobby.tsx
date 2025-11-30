import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelButton';
import { useLanguage } from '../contexts/LanguageContext';
import { socketClient } from '../utils/socketClient';
import { GameConfig, GameMode, PatternId } from '../types';
import { getGameModeTranslationKey } from '../utils/gameModes/modeHelpers';
import { getModeNameFromTranslation } from '../utils/gameModes/i18nHelpers';
import { getPatternMetadata, getPatternNameFromTranslation } from '../utils/patterns/patternHelpers';

interface Player {
  id: string;
  name: string;
  flagColor: string;
  isReady?: boolean;
}

interface LobbyProps {
  roomCode: string;
  isHost: boolean;
  playerId: string;
  initialPlayers?: Player[];
  onLeave: () => void;
  onStart: (config: GameConfig) => void;
  onHostChange?: (newHostId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ roomCode, isHost, playerId, initialPlayers = [], onLeave, onStart, onHostChange }) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);
  const prevPlayersRef = React.useRef<Player[]>(initialPlayers);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [pattern, setPattern] = useState<PatternId>('default');
  useEffect(() => {
    if (initialPlayers.length > 0) {
      setPlayers(initialPlayers);
      prevPlayersRef.current = initialPlayers;
    }
  }, [initialPlayers]);

  useEffect(() => {
    const handleLobbyCreated = (data: { roomCode?: string; players: Player[]; config?: GameConfig }) => {
      console.log('lobby_created', data);
      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
      if (data.config?.gameMode) {
        setGameMode(data.config.gameMode);
      } else {
        setGameMode('classic');
      }
      if (data.config?.pattern) {
        setPattern(data.config.pattern);
      } else {
        setPattern('default');
      }
    };

    const handleLobbyJoined = (data: { roomCode?: string; players: Player[]; config?: GameConfig }) => {
      console.log('lobby_joined', data);
      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
      if (data.config?.gameMode) {
        setGameMode(data.config.gameMode);
      } else {
        setGameMode('classic');
      }
      if (data.config?.pattern) {
        setPattern(data.config.pattern);
      } else {
        setPattern('default');
      }
    };

    const handlePlayerJoined = (data: { players: Player[]; playerName?: string }) => {
      console.log('player_joined', data);
      if (data.players && Array.isArray(data.players)) {
        const prevPlayers = prevPlayersRef.current;
        const newPlayer = data.players.find(p => !prevPlayers.find(pp => pp.id === p.id));
        if (newPlayer && newPlayer.id !== playerId) {
          const toastId = Date.now().toString() + Math.random().toString();
          setToasts(prev => [...prev, { 
            id: toastId, 
            message: t.modal.playerJoined.replace('{name}', newPlayer.name) 
          }]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 3000);
        }
        setPlayers(data.players);
        prevPlayersRef.current = data.players;
      }
    };

    const handlePlayerLeft = (data: { players: Player[]; playerId?: string; newHostId?: string; playerName?: string }) => {
      console.log('player_left', data);
      if (data.playerId === playerId) {
        onLeave();
        return;
      }
      if (data.players && Array.isArray(data.players)) {
        const prevPlayers = prevPlayersRef.current;
        const leftPlayer = prevPlayers.find(p => !data.players.find(pp => pp.id === p.id));
        if (leftPlayer && leftPlayer.id !== playerId) {
          const toastId = Date.now().toString() + Math.random().toString();
          setToasts(prev => [...prev, { 
            id: toastId, 
            message: t.modal.playerLeft.replace('{name}', leftPlayer.name) 
          }]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 3000);
        }
        setPlayers(data.players);
        prevPlayersRef.current = data.players;
      }
      if (data.newHostId && onHostChange) {
        console.log('Host changed to:', data.newHostId);
        onHostChange(data.newHostId);
      }
    };

    const handleGameStarted = (data: { players: Player[]; config: GameConfig; currentTurn: string }) => {
      onStart(data.config);
    };

    const handleLobbyPlayers = (data: { players: Player[]; config?: GameConfig }) => {
      console.log('lobby_players', data);
      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
      if (data.config?.gameMode) {
        setGameMode(data.config.gameMode);
      } else if (gameMode === undefined) {
        setGameMode('classic');
      }
      if (data.config?.pattern) {
        setPattern(data.config.pattern);
      } else if (pattern === undefined) {
        setPattern('default');
      }
    };

    const handlePlayerReadyUpdated = (data: { players: Player[] }) => {
      console.log('player_ready_updated', data);
      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
    };

    socketClient.on('lobby_created', handleLobbyCreated);
    socketClient.on('lobby_joined', handleLobbyJoined);
    socketClient.on('player_joined', handlePlayerJoined);
    socketClient.on('player_left', handlePlayerLeft);
    socketClient.on('game_started', handleGameStarted);
    socketClient.on('lobby_players', handleLobbyPlayers);
    socketClient.on('player_ready_updated', handlePlayerReadyUpdated);

    let timeout: NodeJS.Timeout | null = null;
    if (roomCode) {
      const requestPlayers = () => {
        socketClient.emit('get_lobby_players', { roomCode });
      };
      requestPlayers();
      timeout = setTimeout(requestPlayers, 100);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      socketClient.off('lobby_created', handleLobbyCreated);
      socketClient.off('lobby_joined', handleLobbyJoined);
      socketClient.off('player_joined', handlePlayerJoined);
      socketClient.off('player_left', handlePlayerLeft);
      socketClient.off('game_started', handleGameStarted);
      socketClient.off('lobby_players', handleLobbyPlayers);
      socketClient.off('player_ready_updated', handlePlayerReadyUpdated);
    };
  }, [onStart, roomCode]);

  const handleStart = () => {
    if (isHost) {
      socketClient.emit('start_game');
    }
  };

  const handleToggleReady = () => {
    socketClient.emit('toggle_ready');
  };

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      const toastId = Date.now().toString() + Math.random().toString();
      setToasts(prev => [...prev, { 
        id: toastId, 
        message: t.modal.codeCopied 
      }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const allReady = players.length >= 2 && players.every(p => p.isReady);
  const canStart = isHost && allReady;
  const currentPlayer = players.find(p => p.id === playerId);
  const isCurrentPlayerReady = currentPlayer?.isReady || false;
  const allExceptHostReady = players.length >= 2 && players.filter(p => p.id !== playerId || !isHost).every(p => p.isReady);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 md:gap-6 w-full relative">
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-1rem)]">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 border-[#4B5563] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg pointer-events-auto animate-slide-in-right flex items-center gap-2"
            style={{ 
              animationDelay: `${index * 0.05}s`
            }}
          >
            <p className="text-[10px] sm:text-xs font-pixel text-gray-200 whitespace-nowrap">{toast.message}</p>
          </div>
        ))}
      </div>
      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-5">
        <div className="text-center">
          <div className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2 font-pixel uppercase tracking-wider">{t.modal.roomCode}</div>
          <div className="flex items-center justify-center mb-1 sm:mb-2">
            <button
              onClick={handleCopyCode}
              className="text-lg sm:text-2xl md:text-3xl font-pixel text-[#60A5FA] tracking-[0.1em] sm:tracking-[0.2em] break-all cursor-pointer hover:underline transition-all duration-200 active:scale-95"
              title={t.modal.copyCode}
            >
              {roomCode}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-[10px] sm:text-xs text-green-400 font-pixel">{t.modal.activeRoom}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
        <div className="text-[10px] sm:text-xs text-gray-400 font-pixel uppercase text-center mb-1.5 sm:mb-2">
          {t.modal.gameMode}: <span className="text-[#60A5FA]">{getModeNameFromTranslation(getGameModeTranslationKey(gameMode), t)}</span>
        </div>
        <div className="text-[10px] sm:text-xs text-gray-400 font-pixel uppercase text-center">
          {t.modal.pattern}: <span className="text-[#60A5FA]">{(() => {
            const metadata = getPatternMetadata(pattern);
            return metadata ? getPatternNameFromTranslation(metadata.translationKey, t) : pattern;
          })()}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] rounded-lg sm:rounded-xl p-2.5 sm:p-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="text-[10px] sm:text-xs text-gray-400 font-pixel uppercase text-center">
            {players.length < 2 ? t.modal.waitingForPlayers : `${players.length}/6 ${t.modal.players}`}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 max-h-48 overflow-y-auto">
          {players.map((player, index) => {
            const isPlayerHost = (isHost && player.id === playerId) || index === 0;
            return (
            <div
              key={player.id}
              className={`bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 ${
                player.id === playerId ? 'border-[#6366F1]' : 'border-[#4B5563]'
              } rounded-lg px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 flex items-center justify-between transition-all duration-200`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div 
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${
                    player.isReady 
                      ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50' 
                      : 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50'
                  }`}
                >
                  {player.isReady ? (
                    <i className="fi fi-br-check-circle text-green-400 text-xs sm:text-sm"></i>
                  ) : (
                    <i className="fi fi-br-cross-circle text-red-400 text-xs sm:text-sm"></i>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {isPlayerHost && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/50 flex items-center justify-center flex-shrink-0 -mt-0.5">
                        <i className="fi fi-br-crown text-purple-400 text-[10px] sm:text-xs"></i>
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-pixel text-gray-200 truncate">{player.name}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 font-pixel truncate  mt-1">ID: {player.id.substring(0, 6)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div 
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[#4B5563]"
                  style={{ backgroundColor: 
                    player.flagColor === 'yellow' ? '#FBBF24' : 
                    player.flagColor === 'red' ? '#F87171' :
                    player.flagColor === 'blue' ? '#60A5FA' :
                    player.flagColor === 'green' ? '#34D399' :
                    player.flagColor === 'purple' ? '#A78BFA' :
                    player.flagColor === 'pink' ? '#F472B6' :
                    player.flagColor === 'orange' ? '#FB923C' :
                    player.flagColor === 'cyan' ? '#22D3EE' :
                    player.flagColor === 'indigo' ? '#818CF8' :
                    player.flagColor === 'teal' ? '#14B8A6' :
                    player.flagColor === 'emerald' ? '#10B981' :
                    player.flagColor === 'lime' ? '#84CC16' :
                    player.flagColor === 'amber' ? '#F59E0B' :
                    player.flagColor === 'rose' ? '#F43F5E' :
                    player.flagColor === 'sky' ? '#0EA5E9' :
                    player.flagColor === 'violet' ? '#8B5CF6' :
                    player.flagColor === 'fuchsia' ? '#D946EF' : '#FBBF24'
                  }}
                ></div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {allReady && (
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-xl p-2 sm:p-3">
          <div className="text-center text-xs sm:text-sm font-pixel text-green-400 flex items-center justify-center gap-1.5 sm:gap-2">
            <i className="fi fi-br-check-circle text-xs sm:text-sm"></i>
            {t.modal.allReady}
          </div>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3 w-full mt-auto pt-4 sm:pt-6">
        <PixelButton onClick={onLeave} variant="secondary" className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5">
          {t.modal.leave}
        </PixelButton>
        {isHost && allReady ? (
          <PixelButton 
            onClick={handleStart}
            className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5"
            variant="primary"
          >
            {t.menu.play}
          </PixelButton>
        ) : (
          <PixelButton 
            onClick={handleToggleReady}
            variant={isCurrentPlayerReady ? "primary" : "secondary"}
            className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5"
          >
            {isCurrentPlayerReady ? t.modal.notReady : t.modal.ready}
          </PixelButton>
        )}
      </div>
    </div>
  );
};