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
import { settingsClient, setUserId } from './utils/settingsClient';
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      
      try {
        if (isAuthenticated && user) {
          setUserId(user.id);
        }

        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            setConfig({ rows: 9, cols: 9, mines: 10, ...parsed, gameMode: parsed.gameMode || 'classic', pattern: parsed.pattern || 'default' });
          } catch (e) {
            console.error('Failed to parse game config:', e);
            setConfig({ rows: 9, cols: 9, mines: 10, gameMode: 'classic', pattern: 'default' });
          }
        } else {
          setConfig({ rows: 9, cols: 9, mines: 10, gameMode: 'classic', pattern: 'default' });
        }

        const savedFlagColor = localStorage.getItem('flagColor');
        if (savedFlagColor) {
          setFlagColor(savedFlagColor);
        }

        if (isAuthenticated && user) {
          setPlayerName(user.username);
          if (user.playerId) {
            setPlayerId(user.playerId);
            await settingsClient.setSetting('playerId', user.playerId);
          }
        } else {
          setPlayerName('Guest');

          const savedPlayerId = await settingsClient.getSetting('playerId');
          if (!savedPlayerId || savedPlayerId.length !== 7 || !/^\d+$/.test(savedPlayerId)) {
            const newGuestId = generateGuestPlayerId();
            setPlayerId(newGuestId);
            await settingsClient.setSetting('playerId', newGuestId);
          } else {
            setPlayerId(savedPlayerId);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    let currentProgress = 0;
    const animate = () => {
      if (currentProgress >= 100) {
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
        }, 200);
        return;
      }

      const speedVariation = Math.random() * 2 + 0.5;
      currentProgress += speedVariation;
      
      if (currentProgress > 100) {
        currentProgress = 100;
      }

      setProgress(currentProgress);

      const delay = Math.random() > 0.7 ? Math.random() * 150 + 50 : Math.random() * 50 + 20;
      setTimeout(animate, delay);
    };

    animate();
  }, [authLoading]);

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
    try {
      localStorage.setItem('gameConfig', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to save game config:', error);
    }
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
      { hex: '#7cb342' },
      { hex: '#9ccc65' },
      { hex: '#8bc34a' },
      { hex: '#689f38' },
      { hex: '#558b2f' },
      { hex: '#aed581' },
      { hex: '#c5e1a5' },
      { hex: '#dce775' },
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
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className="bg-gradient-to-br from-[#8b6f47] to-[#6b4423] p-1 sm:p-1.5 rounded-2xl shadow-2xl border border-[#a0826d]/20 w-full max-w-[280px] sm:max-w-[320px]">
          <div className="flex flex-col space-y-4 w-full p-6 bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-2 border-[#6b4423]/50 rounded-xl shadow-inner">
            <div className="text-[#F6EBCB] text-lg sm:text-xl font-pixel text-center">
              Loading...
            </div>
            <div className="w-full bg-[#3a2817] border-2 border-[#6b4423] rounded-full overflow-hidden" style={{ height: '24px' }}>
              <div 
                className="h-full bg-gradient-to-r from-[#7cb342] to-[#558b2f] rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center text-white relative overflow-x-hidden"
      style={{ height: '100vh', position: 'relative', zIndex: 1 }}
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
                const currentName = isAuthenticated && user ? user.username : 'Guest';
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
            key={`${config.rows}-${config.cols}-${config.mines}-${config.gameMode}-${config.pattern}`}
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
        <div className="text-[#c5a572] text-xs font-pixel drop-shadow-lg">
          ID: {playerId}
        </div>
      </div>
    </div>
  );
};

export default App;