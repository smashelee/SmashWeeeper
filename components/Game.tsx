import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameConfig, CellData, GameStatus } from '../types';
import { PixelButton } from './PixelButton';
import { Modal } from './Modal';
import { useLanguage } from '../contexts/LanguageContext';
import { NUMBER_COLORS, GAME_VERSION } from '../constants';
import { socketClient } from '../utils/socketClient';
import { getGameMode } from '../utils/gameModes';
import { db } from '../utils/database';
import { playRandomLoseSound, playRandomWinSound, playOpenCellSound, playOpenAreaSound, stopAllSounds } from '../utils/sounds';

interface GameProps {
  config: GameConfig;
  onExit: () => void;
  isMultiplayer?: boolean;
  roomCode?: string;
  playerId?: string;
  isHost?: boolean;
}

const FLAG_COLOR_MAP: Record<string, { gradient: string; border: string; shadow: string; iconColor: string; textColor: string }> = {
  yellow: { gradient: 'from-yellow-500 to-yellow-600', border: 'border-yellow-400', shadow: 'shadow-yellow-900/50', iconColor: 'text-yellow-400', textColor: 'text-[#FBBF24]' },
  red: { gradient: 'from-red-500 to-red-600', border: 'border-red-400', shadow: 'shadow-red-900/50', iconColor: 'text-red-400', textColor: 'text-[#F87171]' },
  blue: { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-400', shadow: 'shadow-blue-900/50', iconColor: 'text-blue-400', textColor: 'text-[#60A5FA]' },
  green: { gradient: 'from-green-500 to-green-600', border: 'border-green-400', shadow: 'shadow-green-900/50', iconColor: 'text-green-400', textColor: 'text-[#34D399]' },
  purple: { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-400', shadow: 'shadow-purple-900/50', iconColor: 'text-purple-400', textColor: 'text-[#A78BFA]' },
  pink: { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-400', shadow: 'shadow-pink-900/50', iconColor: 'text-pink-400', textColor: 'text-[#F472B6]' },
  orange: { gradient: 'from-orange-500 to-orange-600', border: 'border-orange-400', shadow: 'shadow-orange-900/50', iconColor: 'text-orange-400', textColor: 'text-[#FB923C]' },
  cyan: { gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-400', shadow: 'shadow-cyan-900/50', iconColor: 'text-cyan-400', textColor: 'text-[#22D3EE]' },
  indigo: { gradient: 'from-indigo-500 to-indigo-600', border: 'border-indigo-400', shadow: 'shadow-indigo-900/50', iconColor: 'text-indigo-400', textColor: 'text-[#818CF8]' },
  teal: { gradient: 'from-teal-500 to-teal-600', border: 'border-teal-400', shadow: 'shadow-teal-900/50', iconColor: 'text-teal-400', textColor: 'text-[#14B8A6]' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-400', shadow: 'shadow-emerald-900/50', iconColor: 'text-emerald-400', textColor: 'text-[#10B981]' },
  lime: { gradient: 'from-lime-500 to-lime-600', border: 'border-lime-400', shadow: 'shadow-lime-900/50', iconColor: 'text-lime-400', textColor: 'text-[#84CC16]' },
  amber: { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-400', shadow: 'shadow-amber-900/50', iconColor: 'text-amber-400', textColor: 'text-[#F59E0B]' },
  rose: { gradient: 'from-rose-500 to-rose-600', border: 'border-rose-400', shadow: 'shadow-rose-900/50', iconColor: 'text-rose-400', textColor: 'text-[#F43F5E]' },
};

interface MultiplayerPlayer {
  id: string;
  name: string;
  flagColor: string;
}

export const Game: React.FC<GameProps> = ({ config, onExit, isMultiplayer = false, roomCode, playerId, isHost = false }) => {
  const { t } = useLanguage();
  const [cells, setCells] = useState<CellData[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [cellButtonPosition, setCellButtonPosition] = useState<{x: number, y: number} | null>(null);
  const [flagColor, setFlagColor] = useState<string>('yellow');
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<MultiplayerPlayer[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [gameEndPlayer, setGameEndPlayer] = useState<{ name: string; isWinner: boolean } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  
  const syncTurnStartTime = (serverTurnStartTime: number, serverTimestamp?: number) => {
    const localNow = Date.now();
    if (serverTimestamp !== undefined) {
      const timeDiff = localNow - serverTimestamp;
      const adjustedTurnStartTime = serverTurnStartTime + timeDiff;
      setTurnStartTime(adjustedTurnStartTime);
    } else {
      if (serverTurnStartTime > localNow) {
        setTurnStartTime(localNow);
      } else {
        setTurnStartTime(serverTurnStartTime);
      }
    }
  };

  useEffect(() => {
    const loadFlagColor = async () => {
      try {
        await db.init();
        const saved = await db.getSetting('flagColor');
        if (saved) setFlagColor(saved);
      } catch (error) {
        console.error('Failed to load flag color:', error);
      }
    };
    loadFlagColor();

    const handleFlagColorChanged = (e: CustomEvent) => {
      setFlagColor(e.detail);
    };
    window.addEventListener('flagColorChanged', handleFlagColorChanged as EventListener);
    return () => {
      window.removeEventListener('flagColorChanged', handleFlagColorChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isMultiplayer || !roomCode) return;

    const handleGameStarted = (data: { players: MultiplayerPlayer[]; currentTurn: string; config: GameConfig; turnStartTime?: number; timestamp?: number }) => {
      console.log('game_started', data);
      setCells([]);
      setStatus('playing');
      soundPlayedRef.current = { won: false, lost: false };
      setTime(0);
      setFirstClick(true);
      setShowGameOverModal(false);
      setGameEndPlayer(null);
      if (data.players && data.players.length > 0) {
        setMultiplayerPlayers(data.players);
      }
      if (data.currentTurn) {
        setCurrentTurn(data.currentTurn);
      }
      if (data.config?.gameMode) {
        config.gameMode = data.config.gameMode;
        if (data.config.gameMode === 'timed') {
          if (data.turnStartTime !== undefined) {
            syncTurnStartTime(data.turnStartTime, data.timestamp);
          } else {
            setTurnStartTime(Date.now());
          }
          setDisplayTime(15);
        }
      }
      setTimeout(() => {
        socketClient.emit('request_sync');
      }, 100);
    };

    socketClient.on('game_started', handleGameStarted);
    
    const handleTimeout = () => {
      console.log('timeout_game');
      setStatus('timeout');
      setShowGameOverModal(true);
    };

    socketClient.on('timeout_game', handleTimeout);
    
    setTimeout(() => {
      socketClient.emit('request_sync');
    }, 200);

    const handleTurnChanged = (data: { currentTurn: string; turnStartTime?: number; timestamp?: number }) => {
      console.log('turn_changed', data);
      setCurrentTurn(data.currentTurn);
      if (config.gameMode === 'timed' && data.turnStartTime) {
        setDisplayTime(15);
        syncTurnStartTime(data.turnStartTime, data.timestamp);
      }
    };

    const handleBoardSync = (data: { cells: CellData[][]; status: GameStatus; time: number; flaggedCount: number; currentTurn?: string; players?: MultiplayerPlayer[]; turnStartTime?: number; gameMode?: 'classic' | 'timed'; timestamp?: number }) => {
      console.log('board_sync', data);
      if (data.cells && data.cells.length > 0 && data.cells[0] && data.cells[0].length > 0) {
        console.log('First flagged cell:', data.cells.flat().find(c => c.isFlagged && c.flaggedBy));
        setCells(data.cells);
        setStatus(data.status);
        setTime(data.time);
        
        if (data.status === 'idle' || data.status === 'playing') {
          soundPlayedRef.current = { won: false, lost: false };
        }
        if (data.gameMode && data.gameMode !== config.gameMode) {
          config.gameMode = data.gameMode;
        }
        if (data.currentTurn) {
          setCurrentTurn(data.currentTurn);
        }
        if (data.turnStartTime !== undefined) {
          syncTurnStartTime(data.turnStartTime, data.timestamp);
        } else if (config.gameMode === 'timed' && data.currentTurn) {
          if (!turnStartTime) {
            setTurnStartTime(Date.now());
          }
        }
        if (data.players && data.players.length > 0) {
          setMultiplayerPlayers(data.players);
        }
        if (data.status === 'won' || data.status === 'lost' || data.status === 'timeout') {
          setShowGameOverModal(true);
          if (config.gameMode === 'timed' && displayTime > 0) {
            frozenTimeRef.current = displayTime;
          }
          if (data.status === 'won' && !soundPlayedRef.current.won) {
            playRandomWinSound();
            soundPlayedRef.current.won = true;
          } else if (data.status === 'lost' && !soundPlayedRef.current.lost) {
            playRandomLoseSound();
            soundPlayedRef.current.lost = true;
          }
        }
      } else {
        console.log('board_sync received with empty cells, requesting sync again');
        setTimeout(() => {
          socketClient.emit('request_sync');
        }, 200);
      }
    };

    const handleCellUpdates = (data: { updates: Array<{ row: number; col: number; isRevealed: boolean; neighborMines?: number; isMine?: boolean }>; playerId: string }) => {
      console.log('cell_updates', data);
      let firstUpdate = true;
      setCells(prevCells => {
        if (prevCells.length === 0) {
          return prevCells;
        }
        const newCells = prevCells.map(r => r.map(c => ({ ...c })));
        data.updates.forEach(update => {
          if (newCells[update.row]?.[update.col]) {
            const wasRevealed = newCells[update.row][update.col].isRevealed;
            newCells[update.row][update.col].isRevealed = update.isRevealed;
            if (update.neighborMines !== undefined) {
              newCells[update.row][update.col].neighborMines = update.neighborMines;
            }
            if (update.isMine !== undefined) {
              newCells[update.row][update.col].isMine = update.isMine;
            }
            
            if (firstUpdate && update.isRevealed && !wasRevealed && !update.isMine) {
              if (update.neighborMines === 0) {
                playOpenAreaSound();
              } else {
                playOpenCellSound();
              }
              firstUpdate = false;
            }
          }
        });
        return newCells;
      });
    };

    const handleFlagUpdate = (data: { row: number; col: number; isFlagged: boolean; playerId: string }) => {
      console.log('flag_update', data);
      setCells(prevCells => {
        if (prevCells.length === 0) {
          return prevCells;
        }
        const newCells = prevCells.map(r => r.map(c => ({ ...c })));
        if (newCells[data.row]?.[data.col]) {
          newCells[data.row][data.col].isFlagged = data.isFlagged;
          newCells[data.row][data.col].flaggedBy = data.isFlagged ? data.playerId : undefined;
        }
        return newCells;
      });
    };

    const handleGameStateUpdate = (data: { status: GameStatus; time: number; flaggedCount: number; playerId?: string; playerName?: string }) => {
      console.log('game_state_update', data);
      setStatus(data.status);
      setTime(data.time);
      if (data.status === 'won' || data.status === 'lost' || data.status === 'timeout') {
        if (data.playerName) {
          setGameEndPlayer({ 
            name: data.playerName, 
            isWinner: data.status === 'won' 
          });
        }
        setShowGameOverModal(true);
        if (data.status === 'won' && !soundPlayedRef.current.won) {
          playRandomWinSound();
          soundPlayedRef.current.won = true;
        } else if (data.status === 'lost' && !soundPlayedRef.current.lost) {
          playRandomLoseSound();
          soundPlayedRef.current.lost = true;
        }
      }
    };

    const handleError = (data: { message: string }) => {
      console.log('error', data);
      const toastId = Date.now().toString() + Math.random().toString();
      setToasts(prev => [...prev, { id: toastId, message: data.message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 2000);
    };

    const handlePlayerLeft = (data: { playerId?: string; playerName?: string; players?: MultiplayerPlayer[] }) => {
      console.log('player_left', data);
      if (data.playerName && data.playerId !== playerId) {
        const toastId = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { 
          id: toastId, 
          message: t.modal.playerLeft.replace('{name}', data.playerName || 'Игрок') 
        }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 3000);
      }
      if (data.players && data.players.length > 0) {
        setMultiplayerPlayers(data.players);
      }
    };

    const handlePlayerDisconnected = (data: { playerId?: string; playerName?: string }) => {
      console.log('player_disconnected', data);
      if (data.playerName && data.playerId !== playerId) {
        const toastId = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { 
          id: toastId, 
          message: t.modal.playerLeft.replace('{name}', data.playerName || 'Игрок') 
        }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 3000);
      }
    };

    socketClient.on('error', handleError);
    socketClient.on('player_left', handlePlayerLeft);
    socketClient.on('player_disconnected', handlePlayerDisconnected);

    socketClient.on('turn_changed', handleTurnChanged);
    socketClient.on('board_sync', handleBoardSync);
    socketClient.on('cell_updates', handleCellUpdates);
    socketClient.on('flag_update', handleFlagUpdate);
    socketClient.on('game_state_update', handleGameStateUpdate);

    return () => {
      socketClient.off('game_started', handleGameStarted);
      socketClient.off('turn_changed', handleTurnChanged);
      socketClient.off('board_sync', handleBoardSync);
      socketClient.off('cell_updates', handleCellUpdates);
      socketClient.off('flag_update', handleFlagUpdate);
      socketClient.off('game_state_update', handleGameStateUpdate);
      socketClient.off('error', handleError);
      socketClient.off('player_left', handlePlayerLeft);
      socketClient.off('player_disconnected', handlePlayerDisconnected);
      socketClient.off('timeout_game', handleTimeout);
    };
  }, [isMultiplayer, roomCode]);

  const getFlagColorClasses = useCallback((playerId?: string) => {
    let colorKey = flagColor;
    if (isMultiplayer && playerId && multiplayerPlayers.length > 0) {
      const player = multiplayerPlayers.find(p => p.id === playerId);
      if (player) {
        colorKey = player.flagColor;
      }
    }
    const color = FLAG_COLOR_MAP[colorKey] || FLAG_COLOR_MAP.yellow;
    return `bg-gradient-to-br ${color.gradient} ${color.border} text-white ${color.shadow}`;
  }, [flagColor, isMultiplayer, multiplayerPlayers]);

  const flagCounterColor = useMemo(() => {
    const color = FLAG_COLOR_MAP[flagColor] || FLAG_COLOR_MAP.yellow;
    return {
      icon: color.iconColor,
      text: color.textColor,
    };
  }, [flagColor]);

  const initializeEmptyBoard = useCallback((): CellData[][] => {
    const gameMode = getGameMode(config.gameMode || 'classic');
    return gameMode.createEmptyBoard(config.rows, config.cols);
  }, [config.rows, config.cols, config.gameMode]);

  const cellSize = useMemo(() => {
    if (typeof window === 'undefined') {
      return 32;
    }
    
    const isMobile = window.innerWidth < 640;
    const maxContainerWidth = isMobile ? window.innerWidth : 600;
    
    const outerPadding = isMobile ? 4 : 8; 
    const greyPadding = isMobile ? 2 : 4; 
    const innerPadding = isMobile ? 6 : 12; 
    const gridPadding = isMobile ? 2 : 5; 
    const gapSize = 4;
    const safetyMargin = isMobile ? 2 : 2;
    
    const totalHorizontalPadding = outerPadding * 2 + greyPadding * 2 + innerPadding * 2 + gridPadding * 2;
    const availableWidth = maxContainerWidth - totalHorizontalPadding - safetyMargin; 
    
    let size = Math.floor((availableWidth - (config.cols - 1) * gapSize) / config.cols);
    
    const totalGridWidth = config.cols * size + (config.cols - 1) * gapSize;
    if (totalGridWidth > availableWidth) {
      size = Math.max(1, Math.floor((availableWidth - (config.cols - 1) * gapSize) / config.cols));
    }
    
    if (config.cols >= 12) {
      if (isMobile) {
        size = Math.max(22, Math.min(size, 32));
      } else {
        size = Math.max(22, Math.min(size, 32));
      }
    } else if (isMobile) {
      size = Math.max(24, Math.min(size, 36));
    } else {
      size = Math.max(24, Math.min(size, 40));
    }
    
    const finalGridWidth = config.cols * size + (config.cols - 1) * gapSize;
    if (finalGridWidth > availableWidth - 2) {
      size = Math.max(1, Math.floor((availableWidth - 2 - (config.cols - 1) * gapSize) / config.cols));
    }
    
    return size;
  }, [config.rows, config.cols, windowSize]);

  const fontSize = useMemo(() => {
    if (cellSize <= 24) return 'text-[10px]';
    if (cellSize <= 32) return 'text-xs';
    if (cellSize <= 40) return 'text-sm';
    return 'text-base';
  }, [cellSize]);

  const placeMines = useCallback((board: CellData[][], excludeRow: number, excludeCol: number): CellData[][] => {
    const gameMode = getGameMode(config.gameMode || 'classic', config.pattern);
    const result = gameMode.placeMines(
      board,
      config.mines,
      excludeRow,
      excludeCol,
      config.rows,
      config.cols
    );
    return result;
  }, [config.rows, config.cols, config.mines, config.gameMode, config.pattern]);

  const revealCell = useCallback((row: number, col: number, board: CellData[][]): CellData[][] => {
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    
    if (
      row < 0 || row >= config.rows ||
      col < 0 || col >= config.cols ||
      newBoard[row][col].isRevealed ||
      newBoard[row][col].isFlagged
    ) {
      return newBoard;
    }
    
    const queue: Array<[number, number]> = [[row, col]];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const key = `${r},${c}`;
      
      if (visited.has(key)) continue;
      if (
        r < 0 || r >= config.rows ||
        c < 0 || c >= config.cols ||
        newBoard[r][c].isRevealed ||
        newBoard[r][c].isFlagged
      ) {
        continue;
      }
      
      visited.add(key);
      newBoard[r][c].isRevealed = true;
      
      if (newBoard[r][c].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) {
              const nr = r + dr;
              const nc = c + dc;
              if (
                nr >= 0 && nr < config.rows &&
                nc >= 0 && nc < config.cols &&
                !visited.has(`${nr},${nc}`)
              ) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
    
    return newBoard;
  }, [config.rows, config.cols]);

  const openCell = useCallback((row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    if (cells[row]?.[col]?.isFlagged) return;
    if (cells[row]?.[col]?.isRevealed) return;
    
    setCells(prevCells => {
      let newCells = prevCells.map(r => r.map(c => ({ ...c })));
      
      if (firstClick) {
        newCells = placeMines(newCells, row, col);
        setFirstClick(false);
        setStatus('playing');
      soundPlayedRef.current = { won: false, lost: false };
        if (config.gameMode === 'timed' && !isMultiplayer) {
          setTurnStartTime(Date.now());
        }
      } else if (config.gameMode === 'timed' && !isMultiplayer) {
        setTurnStartTime(Date.now());
      }
      
      newCells = revealCell(row, col, newCells);
      
      if (newCells[row][col].isMine) {
        newCells = newCells.map(r => r.map(c => 
          c.isMine ? { ...c, isRevealed: true } : c
        ));
        setStatus('lost');
        setShowGameOverModal(true);
        if (!soundPlayedRef.current.lost) {
          playRandomLoseSound();
          soundPlayedRef.current.lost = true;
        }
        return newCells;
      }
      
      if (newCells[row][col].neighborMines === 0) {
        playOpenAreaSound();
      } else {
        playOpenCellSound();
      }
      
      const allNonMinesRevealed = newCells.every(r => 
        r.every(c => c.isMine || c.isRevealed)
      );
      
      if (allNonMinesRevealed) {
        setStatus('won');
        setShowGameOverModal(true);
        if (!soundPlayedRef.current.won) {
          playRandomWinSound();
          soundPlayedRef.current.won = true;
        }
        newCells = newCells.map(r => r.map(c => {
          if (c.isMine) {
            return { ...c, isFlagged: true };
          }
          if (!c.isRevealed) {
            return { ...c, isRevealed: true };
          }
          return c;
        }));
        return newCells;
      }
      
      return newCells;
    });
  }, [status, firstClick, cells, placeMines, revealCell]);

  const handleCellClick = useCallback((row: number, col: number, forceOpen: boolean = false) => {
    const isMobile = (windowSize.width > 0 && windowSize.width < 640) || 
                     (windowSize.width === 0 && typeof window !== 'undefined' && window.innerWidth < 640);
    
    if (isMobile && !forceOpen && !cells[row]?.[col]?.isRevealed) {
      if (isMultiplayer) {
        if (currentTurn !== playerId) {
          const toastId = Date.now().toString() + Math.random().toString();
          setToasts(prev => [...prev, { id: toastId, message: t.modal.notYourTurn }]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 2000);
          return;
        }
      }
      
      const button = document.querySelector(`button[data-cell-key="${row}-${col}"]`) as HTMLElement;
      if (button) {
        const rect = button.getBoundingClientRect();
        setCellButtonPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setSelectedCell({ row, col });
      }
      return;
    }
    
    if (isMultiplayer) {
      if (cells[row]?.[col]?.isFlagged) {
        return;
      }
      if (cells[row]?.[col]?.isRevealed) {
        return;
      }
      if (currentTurn !== playerId) {
        const toastId = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id: toastId, message: t.modal.notYourTurn }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 2000);
        return;
      }
      socketClient.emit('cell_click', { row, col });
      return;
    }
    
    openCell(row, col);
  }, [cells, windowSize, openCell, isMultiplayer, currentTurn, playerId, config.gameMode]);

  const toggleFlag = useCallback((row: number, col: number) => {
    if (isMultiplayer) {
      if (currentTurn !== playerId) {
        const toastId = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id: toastId, message: t.modal.notYourTurn }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 2000);
        return;
      }
      socketClient.emit('toggle_flag', { row, col });
      return;
    }

    if (status === 'won' || status === 'lost') return;
    if (cells[row]?.[col]?.isRevealed) return;
    
    const newFlaggedState = !cells[row][col].isFlagged;
    
    setCells(prevCells => {
      const newCells = prevCells.map(r => r.map(c => ({ ...c })));
      newCells[row][col].isFlagged = newFlaggedState;
      return newCells;
    });
  }, [status, cells, isMultiplayer, currentTurn, playerId]);

  const handleCellRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    toggleFlag(row, col);
  }, [toggleFlag]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  }, []);

  const handleTouchCancel = useCallback(() => {
    setSelectedCell(null);
    setCellButtonPosition(null);
  }, []);

  const handleExit = useCallback(() => {
    stopAllSounds();
    onExit();
  }, [onExit]);

  const handleTryAgain = useCallback(() => {
    if (isMultiplayer) {
      socketClient.emit('request_rematch');
      return;
    }
    setCells(initializeEmptyBoard());
    setStatus('idle');
    soundPlayedRef.current = { won: false, lost: false };
    setTime(0);
    setFirstClick(true);
    setShowGameOverModal(false);
    setGameEndPlayer(null);
    if (config.gameMode === 'timed') {
      setTurnStartTime(null);
    }
  }, [initializeEmptyBoard, isMultiplayer, config.gameMode]);

  useEffect(() => {
    if (!isMultiplayer) {
      setCells(initializeEmptyBoard());
    }
  }, [initializeEmptyBoard, isMultiplayer]);


  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (status === 'playing') {
      const interval = setInterval(() => {
        const newTime = time + 1;
        const maxTime = 99 * 60 + 99;
        
        if (newTime >= maxTime) {
          if (isMultiplayer && roomCode) {
            socketClient.emit('timeout_game', { roomCode });
          } else {
            setCells(prevCells => {
              const newCells = prevCells.map(r => r.map(c => 
                c.isMine ? { ...c, isRevealed: true } : c
              ));
              return newCells;
            });
            setStatus('timeout');
            setShowGameOverModal(true);
          }
          return;
        }
        
        if (isMultiplayer && roomCode) {
          socketClient.emit('update_time', { time: newTime });
        }
        setTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, isMultiplayer, roomCode, time]);

  useEffect(() => {
    if (status === 'playing' && config.gameMode === 'timed' && turnStartTime) {
      const checkTimeout = () => {
        const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
        if (elapsed >= 15) {
          if (isMultiplayer && roomCode && currentTurn === playerId) {
            socketClient.emit('turn_timeout', { roomCode });
          } else if (!isMultiplayer) {
            setCells(prevCells => {
              const newCells = prevCells.map(r => r.map(c => 
                c.isMine ? { ...c, isRevealed: true } : c
              ));
              return newCells;
            });
            setStatus('timeout');
            setShowGameOverModal(true);
          }
        }
      };
      
      const interval = setInterval(checkTimeout, 100);
      return () => clearInterval(interval);
    }
  }, [status, config.gameMode, isMultiplayer, currentTurn, playerId, turnStartTime, roomCode]);

  useEffect(() => {
    if (!selectedCell) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cell-action-panel') && !target.closest(`button[data-cell-key]`)) {
        setSelectedCell(null);
        setCellButtonPosition(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedCell]);

  useEffect(() => {
    const isMobile = (windowSize.width > 0 && windowSize.width < 640) || 
                     (windowSize.width === 0 && typeof window !== 'undefined' && window.innerWidth < 640);
    
    if (!isMobile) return;

    const handleTouchStartNative = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button[data-cell-key]') as HTMLElement;
      
      if (button) {
        const key = button.getAttribute('data-cell-key');
        if (key) {
          const [row, col] = key.split('-').map(Number);
          if (!cells[row]?.[col]?.isRevealed) {
            e.preventDefault();
            const rect = button.getBoundingClientRect();
            
            setCellButtonPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10
            });
            setSelectedCell({ row, col });
          }
        }
      }
    };

    const gridElement = document.querySelector('[style*="gridTemplateColumns"]');
    if (gridElement) {
      gridElement.addEventListener('touchstart', handleTouchStartNative, { passive: false });
      
      return () => {
        gridElement.removeEventListener('touchstart', handleTouchStartNative);
      };
    }
  }, [cells, windowSize]);

  const flaggedCount = useMemo(() => {
    return cells.reduce((count, row) => 
      count + row.filter(cell => cell.isFlagged).length, 0
    );
  }, [cells]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [displayTime, setDisplayTime] = useState(0);
  const frozenTimeRef = React.useRef<number | null>(null);
  const soundPlayedRef = React.useRef<{ won: boolean; lost: boolean }>({ won: false, lost: false });
  
  useEffect(() => {
    if (status === 'idle' && config.gameMode === 'timed') {
      setDisplayTime(15);
      frozenTimeRef.current = null;
    } else if (status === 'playing' && config.gameMode === 'timed') {
      frozenTimeRef.current = null;
      if (turnStartTime) {
        const updateDisplay = () => {
          const now = Date.now();
          const elapsed = Math.floor((now - turnStartTime) / 1000);
          
          if (elapsed < 0) {
            setDisplayTime(15);
            return;
          }
          
          let remaining = 15 - elapsed;
          
          if (remaining < 0) {
            remaining = 0;
          } else if (remaining > 15) {
            remaining = 15;
          }
          
          setDisplayTime(remaining);
        };
        
        updateDisplay();
        const interval = setInterval(updateDisplay, 100);
        return () => clearInterval(interval);
      } else {
        setDisplayTime(15);
      }
    } else if ((status === 'won' || status === 'lost' || status === 'timeout') && config.gameMode === 'timed') {
      setDisplayTime(frozenTimeRef.current || 0);
    } else {
      setDisplayTime(time);
      frozenTimeRef.current = null;
    }
  }, [status, config.gameMode, isMultiplayer, currentTurn, playerId, turnStartTime, time, displayTime]);

  return (
    <div className="flex flex-col w-full sm:p-4 items-center justify-center min-h-screen">
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-1rem)]">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 border-[#4B5563] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg pointer-events-auto animate-slide-in-right"
            style={{ 
              animationDelay: `${index * 0.05}s`
            }}
          >
            <p className="text-[10px] sm:text-xs font-pixel text-gray-200 whitespace-nowrap">{toast.message}</p>
          </div>
        ))}
      </div>
      <div className="text-[#9CA3AF] text-[10px] sm:text-xs font-pixel drop-shadow-lg mb-2">
        {t.menu.version}: {GAME_VERSION}
      </div>
      <div className="bg-gradient-to-br from-[#9CA3AF] to-[#6B7280] p-0.5 sm:p-1.5 rounded-2xl shadow-2xl w-full max-w-[600px] mx-auto border border-[#D1D5DB]/20">
        <div className="bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 border-[#4B5563]/50 rounded-xl p-1.5 sm:p-3 flex flex-col shadow-inner">
          <div className="flex justify-center items-center gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-3 flex-wrap">
            <div className="flex flex-col items-center min-w-0">
              <span className="text-[10px] sm:text-xs text-gray-300 mb-1 sm:mb-1.5 font-pixel uppercase tracking-wider">
                {config.gameMode === 'timed' && (status === 'playing' || status === 'idle')
                  ? t.game.turnTimeLeft 
                  : t.game.time}
              </span>
              <div className={`bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-pixel text-xs sm:text-sm md:text-base shadow-lg shadow-black/30 ${
                config.gameMode === 'timed' && (status === 'playing' || status === 'idle') && turnStartTime
                  ? (displayTime <= 5 ? 'text-red-400 border-red-500' : displayTime <= 10 ? 'text-yellow-400 border-yellow-500' : 'text-[#60A5FA] border-[#4B5563]')
                  : 'text-[#60A5FA] border-[#4B5563]'
              }`}>
                {config.gameMode === 'timed' && (status === 'playing' || status === 'idle')
                  ? displayTime.toString().padStart(2, '0')
                  : formatTime(displayTime)}
              </div>
            </div>
            
            <div className="flex flex-col items-center min-w-0">
              <div className="text-[10px] sm:text-xs text-gray-300 mb-1 sm:mb-1.5 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                <i className={`fi fi-br-flag-alt ${flagCounterColor.icon} drop-shadow-lg text-xs sm:text-base`}></i>
              </div>
              <div className={`bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-pixel text-xs sm:text-sm md:text-base ${flagCounterColor.text} shadow-lg shadow-black/30`}>
                {config.mines - flaggedCount}
              </div>
            </div>

            {isMultiplayer && currentTurn && (
              <>
                <div className="flex flex-col items-center min-w-0 max-w-[100px] sm:max-w-[120px]">
                  <div className="text-[10px] sm:text-xs text-gray-300 mb-1 sm:mb-1.5 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    <i className="fi fi-br-circle-user text-green-400 drop-shadow-lg text-xs sm:text-base"></i>
                  </div>
                  <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] border-2 border-[#4B5563] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg font-pixel text-xs sm:text-sm md:text-base text-green-400 shadow-lg shadow-black/30 truncate w-full text-center">
                    {currentTurn === playerId ? t.modal.you : (multiplayerPlayers.find(p => p.id === currentTurn)?.name || '...')}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center items-center relative">
            <div 
              className="grid bg-gradient-to-br from-[#111827] to-[#1F2937] rounded-xl mx-auto border-2 border-[#374151] shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
                gap: `4px`,
                width: 'fit-content',
                maxWidth: '100%',
                padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '2px' : '5px',
              }}
            >
              {cells.length > 0 && cells[0]?.length > 0 ? (
                <>
                  {cells.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        data-cell-key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                        onTouchEnd={(e) => handleTouchEnd(e, rowIndex, colIndex)}
                        onTouchCancel={handleTouchCancel}
                        className={`
                          border-2 rounded-lg
                          font-pixel ${fontSize}
                          transition-all duration-150
                          active:scale-90
                          select-none
                          flex items-center justify-center
                          shadow-md
                          ${
                            cell.isRevealed
                              ? cell.isMine
                                ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 text-white shadow-red-900/50'
                                : 'bg-gradient-to-br from-[#4B5563] to-[#374151] border-[#6B7280] text-white shadow-inner'
                              : cell.isFlagged
                              ? getFlagColorClasses(cell.flaggedBy)
                              : 'bg-gradient-to-br from-[#6B7280] to-[#4B5563] border-[#9CA3AF] hover:from-[#4B5563] hover:to-[#374151] hover:border-[#6B7280] active:from-[#374151] active:to-[#1F2937] shadow-lg shadow-black/30 hover:shadow-xl'
                          }
                        `}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          touchAction: 'manipulation',
                          WebkitUserSelect: 'none',
                          userSelect: 'none'
                        }}
                        disabled={status === 'won' || status === 'lost'}
                      >
                        {cell.isRevealed && cell.isMine ? (
                          ''
                        ) : cell.isFlagged ? (
                          <i className="fi fi-br-flag-alt text-white" style={{ fontSize: `${Math.max(cellSize * 0.5, 14)}px` }}></i>
                        ) : cell.isRevealed && cell.neighborMines > 0 ? (
                          <span className={NUMBER_COLORS[cell.neighborMines]}>
                            {cell.neighborMines}
                          </span>
                        ) : (
                          ''
                        )}
                      </button>
                    ))
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-sm font-pixel p-4">{t.modal.loadingBoard}</div>
              )}
            </div>
          </div>
          
          {selectedCell && cellButtonPosition && 
           ((windowSize.width > 0 && windowSize.width < 640) || 
            (windowSize.width === 0 && typeof window !== 'undefined' && window.innerWidth < 640)) && (
            <div
              className="cell-action-panel fixed z-50 flex items-center gap-1.5 bg-gradient-to-br from-[#374151] to-[#1F2937] border-2 border-[#6B7280] rounded-xl p-1.5 shadow-2xl"
              style={(() => {
                const panelWidth = 140;
                const panelHeight = 50;
                const padding = 10;
                
                let x = cellButtonPosition.x;
                let y = cellButtonPosition.y;
                let transform = 'translate(-50%, -100%)';
                
                if (x + panelWidth / 2 > window.innerWidth - padding) {
                  x = window.innerWidth - padding - panelWidth / 2;
                }
                if (x - panelWidth / 2 < padding) {
                  x = padding + panelWidth / 2;
                }
                  
                if (y - panelHeight < padding) {
                  y = cellButtonPosition.y + 50;
                  transform = 'translate(-50%, 0)';
                }
                
                return {
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: transform,
                };
              })()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  if (selectedCell) {
                    toggleFlag(selectedCell.row, selectedCell.col);
                    setSelectedCell(null);
                    setCellButtonPosition(null);
                  }
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 border-2 border-yellow-400 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                disabled={status === 'won' || status === 'lost' || (isMultiplayer && currentTurn !== playerId)}
              >
                <i className="fi fi-br-flag-alt text-white text-base"></i>
              </button>
              
              <button
                onClick={() => {
                  if (selectedCell) {
                    const row = selectedCell.row;
                    const col = selectedCell.col;
                    
                    if (isMultiplayer) {
                      if (currentTurn === playerId && !cells[row]?.[col]?.isFlagged && !cells[row]?.[col]?.isRevealed) {
                        socketClient.emit('cell_click', { row, col });
                      }
                    } else {
                      handleCellClick(row, col, true);
                    }
                    setSelectedCell(null);
                    setCellButtonPosition(null);
                  }
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                disabled={status === 'won' || status === 'lost' || cells[selectedCell.row]?.[selectedCell.col]?.isFlagged || (isMultiplayer && currentTurn !== playerId)}
              >
                <i className="fi fi-br-shovel text-white text-base"></i>
              </button>
              
              <button
                onClick={() => {
                  setSelectedCell(null);
                  setCellButtonPosition(null);
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-gray-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 sm:gap-3 items-center justify-center mt-3 sm:mt-4 w-full max-w-[600px] px-2">
        <PixelButton 
          onClick={() => {
            if (isMultiplayer && (status === 'playing' || status === 'idle')) {
              setShowExitConfirm(true);
            } else {
              handleExit();
            }
          }} 
          variant="secondary" 
          className="text-[10px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg flex-1 sm:flex-none"
        >
          {t.game.exit}
        </PixelButton>
        {(!isMultiplayer || (isMultiplayer && (status === 'won' || status === 'lost' || status === 'timeout'))) && (
          <PixelButton onClick={handleTryAgain} variant="primary" className="text-[10px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg flex-1 sm:flex-none">
            {!isMultiplayer ? t.game.restart : t.game.tryAgain}
          </PixelButton>
        )}
      </div>

      <Modal
        isOpen={status === 'won' && showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        title={t.game.victory}
        showCloseButton={false}
      >
        <div className="text-center">
          <p className="mb-2.5 sm:mb-4 text-[10px] sm:text-sm">{t.game.time}: {formatTime(time)}</p>
          {isMultiplayer && gameEndPlayer && (
            <p className="mb-2.5 sm:mb-4 text-[10px] sm:text-sm text-green-400">
              {t.game.lastMove.replace('{name}', gameEndPlayer.name)}
            </p>
          )}
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                handleTryAgain();
              }} 
              variant="primary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.game.tryAgain}
            </PixelButton>
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }} 
              variant="secondary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.game.menu}
            </PixelButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={status === 'timeout' && showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        title={t.game.timeOut}
        showCloseButton={false}
        showXButton={true}
      >
        <div className="text-center">
          <p className="mb-2.5 sm:mb-4 text-[10px] sm:text-sm text-yellow-400">
            {isMultiplayer && gameEndPlayer
              ? t.game.timeOutTextMultiplayer.replace('{name}', gameEndPlayer.name)
              : t.game.timeOutText}
          </p>
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            {isMultiplayer && (
              <PixelButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgain();
                }} 
                variant="primary"
                className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
              >
                {t.game.tryAgain}
              </PixelButton>
            )}
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }} 
              variant="secondary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.game.menu}
            </PixelButton>
            {!isMultiplayer && (
              <PixelButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgain();
                }} 
                variant="primary"
                className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
              >
                {t.game.tryAgain}
              </PixelButton>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={status === 'lost' && showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        title={t.game.gameOver}
        showCloseButton={false}
      >
        <div className="text-center">
          {isMultiplayer && gameEndPlayer && (
            <p className="mb-2.5 sm:mb-4 text-[10px] sm:text-sm text-red-400">
              {t.game.clickedMine.replace('{name}', gameEndPlayer.name)}
            </p>
          )}
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            {isMultiplayer && (
              <PixelButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgain();
                }} 
                variant="primary"
                className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
              >
                {t.game.tryAgain}
              </PixelButton>
            )}
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }} 
              variant="secondary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.game.menu}
            </PixelButton>
            {!isMultiplayer && (
              <PixelButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryAgain();
                }} 
                variant="primary"
                className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
              >
                {t.game.tryAgain}
              </PixelButton>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title={t.modal.exitConfirm}
        showCloseButton={false}
        showXButton={false}
      >
        <div className="text-center">
          <p className="mb-4 text-[10px] sm:text-sm text-gray-300">{t.modal.exitConfirmText}</p>
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                setShowExitConfirm(false);
              }} 
              variant="secondary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.modal.cancel}
            </PixelButton>
            <PixelButton 
              onClick={(e) => {
                e.stopPropagation();
                setShowExitConfirm(false);
                handleExit();
              }} 
              variant="primary"
              className="text-[10px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 flex-1 sm:flex-none min-w-[90px] sm:min-w-[100px]"
            >
              {t.modal.confirm}
            </PixelButton>
          </div>
        </div>
      </Modal>

    </div>
  );
};