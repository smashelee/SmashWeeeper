import React, { useState, useEffect, useMemo } from 'react';
import { MainMenu } from './components/MainMenu';
import { Game } from './components/Game';
import { Settings } from './components/Settings';
import { Modal } from './components/Modal';
import { CreateRoom } from './components/CreateRoom';
import { JoinRoom } from './components/JoinRoom';
import { Lobby } from './components/Lobby';
import { GameModeSelect } from './components/GameModeSelect';
import { MultiplayerModeSelect } from './components/MultiplayerModeSelect';
import { PixelButton } from './components/PixelButton';
import { AppScreen, GameConfig } from './types';
import { MULTIPLAYER_UNDER_MAINTENANCE } from './constants';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { socketClient } from './utils/socketClient';
import { db } from './utils/database';
import './utils/patterns';

const generateGuestPlayerId = (): string => {
  const length = 7;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<AppScreen>(AppScreen.MENU);
  const [config, setConfig] = useState<GameConfig>({ rows: 9, cols: 9, mines: 10 });
  const [multiplayerModal, setMultiplayerModal] = useState<'select' | 'create' | 'join' | 'lobby' | null>(null);
  const [showDefaultNicknameWarning, setShowDefaultNicknameWarning] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [initialPlayers, setInitialPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState<string>('Guest');
  const [flagColor, setFlagColor] = useState<string>('yellow');
  const [showRematchLobby, setShowRematchLobby] = useState(false);
  const [showGameModeSelect, setShowGameModeSelect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await db.init();

        const migrateFromLocalStorage = async () => {
          const migrated = await db.getSetting('migrated');
          if (!migrated) {
            const lsGameConfig = localStorage.getItem('gameConfig');
            const lsFlagColor = localStorage.getItem('flagColor');
            const lsLanguage = localStorage.getItem('language');
            const lsPlayerId = localStorage.getItem('playerId');
            const lsPlayerName = localStorage.getItem('playerName');
            const lsUserId = localStorage.getItem('userId');

            if (lsGameConfig) await db.setSetting('gameConfig', lsGameConfig);
            if (lsFlagColor) await db.setSetting('flagColor', lsFlagColor);
            if (lsLanguage) await db.setSetting('language', lsLanguage);
            if (lsPlayerId) await db.setSetting('playerId', lsPlayerId);
            if (lsPlayerName) await db.setSetting('playerName', lsPlayerName);
            if (lsUserId) await db.setSetting('userId', lsUserId);

            await db.setSetting('migrated', 'true');
          }
        };

        await migrateFromLocalStorage();

        const savedConfig = await db.getSetting('gameConfig');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            setConfig({ rows: 9, cols: 9, mines: 10, ...parsed, gameMode: parsed.gameMode || 'classic', pattern: parsed.pattern || 'default' });
          } catch (e) {
            console.error('Failed to parse game config:', e);
          }
        } else {
          setConfig({ rows: 9, cols: 9, mines: 10, gameMode: 'classic', pattern: 'default' });
        }

        const savedFlagColor = await db.getSetting('flagColor');
        if (savedFlagColor) {
          setFlagColor(savedFlagColor);
        }

        if (isAuthenticated && user) {
          setPlayerName(user.username);
          await db.setSetting('playerName', user.username);
          if (user.playerId) {
            setPlayerId(user.playerId);
            await db.setSetting('playerId', user.playerId);
          }
        } else {
          const savedPlayerName = await db.getSetting('playerName');
          setPlayerName(savedPlayerName || 'Guest');

          const savedPlayerId = await db.getSetting('playerId');
          if (!savedPlayerId || savedPlayerId.length !== 7 || !/^\d+$/.test(savedPlayerId)) {
            const newGuestId = generateGuestPlayerId();
            setPlayerId(newGuestId);
            await db.setSetting('playerId', newGuestId);
          } else {
            setPlayerId(savedPlayerId);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const connect = async () => {
      try {
        await socketClient.connect();
        socketClient.emit('register', {
          playerId,
          playerName,
          flagColor
        });
      } catch (error) {
        console.error('Failed to connect to server:', error);
      }
    };

    const handleRematchLobbyCreated = (data: { roomCode: string; config: GameConfig; players: any[] }) => {
      setRoomCode(data.roomCode);
      setInitialPlayers(data.players || []);
      setIsHost(true);
      setIsMultiplayer(true);
      setShowRematchLobby(true);
      setMultiplayerModal('lobby');
    };

    const handleRematchLobbyJoined = (data: { roomCode: string; config: GameConfig; players: any[] }) => {
      setRoomCode(data.roomCode);
      setConfig(data.config);
      setInitialPlayers(data.players || []);
      setIsHost(false);
      setIsMultiplayer(true);
      setShowRematchLobby(true);
      setMultiplayerModal('lobby');
    };

    connect();

    socketClient.on('lobby_created', handleRematchLobbyCreated);
    socketClient.on('lobby_joined', handleRematchLobbyJoined);

    return () => {
      socketClient.off('lobby_created', handleRematchLobbyCreated);
      socketClient.off('lobby_joined', handleRematchLobbyJoined);
      socketClient.disconnect();
    };
  }, [playerId, playerName, flagColor]);

  const handleStartGame = () => {
    setShowGameModeSelect(true);
  };

  const handleGameModeSelected = async (gameMode: 'classic' | 'timed', pattern: 'default') => {
    const newConfig = { ...config, gameMode, pattern };
    setConfig(newConfig);
    await db.setSetting('gameConfig', JSON.stringify(newConfig));
    setShowGameModeSelect(false);
    setIsMultiplayer(false);
    setScreen(AppScreen.GAME);
  };

  const handleSaveSettings = (newConfig: GameConfig) => {
    setConfig(newConfig);
  };

  const handleCreateRoom = (gameConfig: GameConfig) => {
    setConfig(gameConfig);
    setIsHost(true);
    setIsMultiplayer(true);
    
    const handleLobbyCreated = (data: { roomCode: string; config: GameConfig; players: any[] }) => {
      setRoomCode(data.roomCode);
      setInitialPlayers(data.players || []);
      setMultiplayerModal('lobby');
      socketClient.off('lobby_created', handleLobbyCreated);
    };

    socketClient.on('lobby_created', handleLobbyCreated);
    
    socketClient.emit('create_lobby', {
      playerId,
      playerName,
      config: gameConfig,
      flagColor
    });
  };

  const handleJoinRoom = (code: string) => {
    setIsHost(false);
    setIsMultiplayer(true);
    
    const handleLobbyJoined = (data: { roomCode: string; config: GameConfig; players: any[] }) => {
      setRoomCode(data.roomCode);
      setConfig(data.config);
      setInitialPlayers(data.players || []);
      setMultiplayerModal('lobby');
    };

    const handleJoinFailed = (data: { message: string }) => {
      const errorMessage = t.modal[data.message as keyof typeof t.modal] || t.modal.joinFailed;
      alert(errorMessage);
      socketClient.off('join_failed', handleJoinFailed);
    };

    socketClient.on('lobby_joined', handleLobbyJoined);
    socketClient.on('join_failed', handleJoinFailed);
    
    socketClient.emit('join_lobby', {
      playerId,
      playerName,
      roomCode: code.toUpperCase(),
      flagColor
    });
  };

  const handleStartFromLobby = (gameConfig?: GameConfig) => {
    if (gameConfig) {
      setConfig(gameConfig);
    }
    setMultiplayerModal(null);
    setShowRematchLobby(false);
    setScreen(AppScreen.GAME);
  };

  const handleLeaveLobby = () => {
    if (roomCode) {
      socketClient.emit('leave_lobby');
    }
    setIsMultiplayer(false);
    setIsHost(false);
    setRoomCode('');
    setInitialPlayers([]);
    setMultiplayerModal(null);
    setShowRematchLobby(false);
    setScreen(AppScreen.MENU);
  };

  const backgroundDots = useMemo(() => {
    const colors = [
      { hex: '#3B82F6' },
      { hex: '#A855F7' },
      { hex: '#EC4899' },
      { hex: '#06B6D4' },
      { hex: '#6366F1' },
      { hex: '#8B5CF6' },
      { hex: '#10B981' },
      { hex: '#14B8A6' },
    ];
    
    const dot1 = {
      top: Math.random() * 50 + 5,
      left: Math.random() * 50 + 5,
      size: Math.random() * 40 + 20,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    
    const dot2 = {
      bottom: Math.random() * 50 + 5,
      right: Math.random() * 50 + 5,
      size: Math.random() * 40 + 20,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    
    return { dot1, dot2 };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center bg-gray-900 text-white relative overflow-x-hidden"
      style={{ height: '100vh' }}
    >
      <div 
        className="absolute blur-xl pointer-events-none rounded-full"
        style={{
          top: `${backgroundDots.dot1.top}%`,
          left: `${backgroundDots.dot1.left}%`,
          width: `${backgroundDots.dot1.size}px`,
          height: `${backgroundDots.dot1.size}px`,
          transform: `rotate(${backgroundDots.dot1.rotate}deg)`,
          backgroundColor: `${backgroundDots.dot1.color.hex}1A`,
        }}
      />
      <div 
        className="absolute blur-xl pointer-events-none rounded-full"
        style={{
          bottom: `${backgroundDots.dot2.bottom}%`,
          right: `${backgroundDots.dot2.right}%`,
          width: `${backgroundDots.dot2.size}px`,
          height: `${backgroundDots.dot2.size}px`,
          transform: `rotate(${backgroundDots.dot2.rotate}deg)`,
          backgroundColor: `${backgroundDots.dot2.color.hex}1A`,
        }}
      />

      <div 
        className="z-10 w-full max-w-full flex justify-center items-center overflow-x-hidden min-h-0"
        style={{ 
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {screen === AppScreen.MENU && (
          <MainMenu 
            onPlay={handleStartGame}
            onMultiplayer={async () => {
              if (MULTIPLAYER_UNDER_MAINTENANCE) {
                setMultiplayerModal('select');
              } else {
                const currentName = await db.getSetting('playerName') || 'Guest';
                if (currentName === 'Guest' || !isAuthenticated) {
                  setShowDefaultNicknameWarning(true);
                } else {
                  setMultiplayerModal('select');
                }
              }
            }}
            onSettings={() => setScreen(AppScreen.SETTINGS)}
          />
        )}

        {screen === AppScreen.GAME && (
          <Game 
            config={config} 
            onExit={() => {
              if (isMultiplayer) {
                socketClient.emit('leave_lobby');
              }
              setScreen(AppScreen.MENU);
              setIsMultiplayer(false);
              setIsHost(false);
              setRoomCode('');
            }}
            isMultiplayer={isMultiplayer}
            roomCode={roomCode}
            playerId={playerId}
            isHost={isHost}
          />
        )}

        {screen === AppScreen.SETTINGS && (
          <Settings 
            config={config} 
            onSave={handleSaveSettings}
            onBack={() => setScreen(AppScreen.MENU)}
          />
        )}
      </div>

      <Modal
        isOpen={multiplayerModal === 'select'}
        onClose={() => setMultiplayerModal(null)}
        title={t.modal.multiplayer}
        showXButton={false}
        showCloseButton={true}
      >
        {MULTIPLAYER_UNDER_MAINTENANCE ? (
          <div className="text-center">
            <p className="mb-4 text-gray-300">{t.modal.multiplayerText}</p>
            <p className="text-sm text-gray-400 mb-6">{t.modal.multiplayerSubtext}</p>
            <PixelButton onClick={() => setMultiplayerModal(null)} variant="primary" className="shadow-lg text-[10px] sm:text-xs px-3 sm:px-3 py-2 sm:py-2.5">
              {t.modal.close}
            </PixelButton>
          </div>
        ) : (
          <MultiplayerModeSelect
            onSelectHost={() => setMultiplayerModal('create')}
            onSelectPlayer={() => setMultiplayerModal('join')}
            onClose={() => setMultiplayerModal(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={multiplayerModal === 'create'}
        onClose={() => setMultiplayerModal('select')}
        title={t.modal.createRoom}
        showXButton={false}
        showCloseButton={false}
      >
        <CreateRoom
          onBack={() => setMultiplayerModal('select')}
          onCreate={handleCreateRoom}
        />
      </Modal>

      <Modal
        isOpen={multiplayerModal === 'join'}
        onClose={() => setMultiplayerModal('select')}
        title={t.modal.joinRoom}
        showXButton={false}
        showCloseButton={false}
        maxWidth="md"
      >
        <JoinRoom
          onBack={() => setMultiplayerModal('select')}
          onJoin={handleJoinRoom}
        />
      </Modal>

      <Modal
        isOpen={multiplayerModal === 'lobby'}
        onClose={() => {}}
        title={t.modal.lobby}
        showXButton={false}
        showCloseButton={false}
      >
        <Lobby
          roomCode={roomCode}
          isHost={isHost}
          playerId={playerId}
          initialPlayers={initialPlayers}
          onLeave={handleLeaveLobby}
          onStart={handleStartFromLobby}
          onHostChange={(newHostId) => {
            setIsHost(newHostId === playerId);
          }}
        />
      </Modal>

      <Modal
        isOpen={showDefaultNicknameWarning}
        onClose={() => {
          setShowDefaultNicknameWarning(false);
        }}
        title={t.modal.defaultNicknameWarning}
        showXButton={false}
        showCloseButton={true}
      >
        <div className="text-center">
          <p className="mb-4 text-gray-300">{t.modal.defaultNicknameText}</p>
          <p className="text-sm text-gray-400">{t.modal.defaultNicknameSubtext}</p>
        </div>
      </Modal>

      <Modal
        isOpen={showGameModeSelect}
        onClose={() => setShowGameModeSelect(false)}
        title={t.modal.selectGameMode}
        showXButton={false}
        showCloseButton={false}
      >
        <GameModeSelect
          onSelect={handleGameModeSelected}
          onBack={() => setShowGameModeSelect(false)}
        />
      </Modal>


      <div className="fixed bottom-4 right-4 z-20">
        <div className="text-[#9CA3AF] text-xs font-pixel drop-shadow-lg">
          ID: {playerId}
        </div>
      </div>
    </div>
  );
};

export default App;