import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelButton';
import { NumberInput } from './NumberInput';
import { Toast } from './Toast';
import { Modal } from './Modal';
import { RegisterModal } from './RegisterModal';
import { LoginModal } from './LoginModal';
import { GameConfig } from '../types';
import { MAX_ROWS, MAX_COLS, MIN_ROWS, MIN_COLS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../utils/i18n';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onBack: () => void;
}

type TabType = 'game' | 'multiplayer';

const FLAG_COLORS = [
  { name: 'Red', value: 'red', gradient: 'from-red-500 to-red-600', border: 'border-red-400', shadow: 'shadow-red-900/50' },
  { name: 'Rose', value: 'rose', gradient: 'from-rose-500 to-rose-600', border: 'border-rose-400', shadow: 'shadow-rose-900/50' },
  { name: 'Orange', value: 'orange', gradient: 'from-orange-500 to-orange-600', border: 'border-orange-400', shadow: 'shadow-orange-900/50' },
  { name: 'Amber', value: 'amber', gradient: 'from-amber-500 to-amber-600', border: 'border-amber-400', shadow: 'shadow-amber-900/50' },
  { name: 'Yellow', value: 'yellow', gradient: 'from-yellow-500 to-yellow-600', border: 'border-yellow-400', shadow: 'shadow-yellow-900/50' },
  { name: 'Lime', value: 'lime', gradient: 'from-lime-500 to-lime-600', border: 'border-lime-400', shadow: 'shadow-lime-900/50' },
  { name: 'Green', value: 'green', gradient: 'from-green-500 to-green-600', border: 'border-green-400', shadow: 'shadow-green-900/50' },
  { name: 'Emerald', value: 'emerald', gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-400', shadow: 'shadow-emerald-900/50' },
  { name: 'Teal', value: 'teal', gradient: 'from-teal-500 to-teal-600', border: 'border-teal-400', shadow: 'shadow-teal-900/50' },
  { name: 'Cyan', value: 'cyan', gradient: 'from-cyan-500 to-cyan-600', border: 'border-cyan-400', shadow: 'shadow-cyan-900/50' },
  { name: 'Sky', value: 'sky', gradient: 'from-sky-500 to-sky-600', border: 'border-sky-400', shadow: 'shadow-sky-900/50' },
  { name: 'Blue', value: 'blue', gradient: 'from-blue-500 to-blue-600', border: 'border-blue-400', shadow: 'shadow-blue-900/50' },
  { name: 'Indigo', value: 'indigo', gradient: 'from-indigo-500 to-indigo-600', border: 'border-indigo-400', shadow: 'shadow-indigo-900/50' },
  { name: 'Violet', value: 'violet', gradient: 'from-violet-500 to-violet-600', border: 'border-violet-400', shadow: 'shadow-violet-900/50' },
  { name: 'Purple', value: 'purple', gradient: 'from-purple-500 to-purple-600', border: 'border-purple-400', shadow: 'shadow-purple-900/50' },
  { name: 'Fuchsia', value: 'fuchsia', gradient: 'from-fuchsia-500 to-fuchsia-600', border: 'border-fuchsia-400', shadow: 'shadow-fuchsia-900/50' },
  { name: 'Pink', value: 'pink', gradient: 'from-pink-500 to-pink-600', border: 'border-pink-400', shadow: 'shadow-pink-900/50' },
];

export const Settings: React.FC<SettingsProps> = ({ config, onSave, onBack }) => {
  const { language, setLanguage, t } = useLanguage();
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('game');
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);
  const [localLanguage, setLocalLanguage] = useState<Language>(language);
  const [playerName, setPlayerName] = useState<string>('Guest');
  const [flagColor, setFlagColor] = useState<string>('yellow');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEasterEggModal, setShowEasterEggModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localSounds, setLocalSounds] = useState({ victory: true, defeat: true });
  const prevConfigRef = React.useRef<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isAuthenticated && user) {
          setPlayerName(user.username);
        } else {
          setPlayerName('Guest');
        }
        
        const savedColor = localStorage.getItem('flagColor');
        if (savedColor) {
          setFlagColor(savedColor);
        }
        
        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            setLocalConfig(parsed);
            prevConfigRef.current = savedConfig;
            if (parsed.sounds) {
              setLocalSounds({
                victory: parsed.sounds.victory !== false,
                defeat: parsed.sounds.defeat !== false
              });
            }
          } catch (e) {
            console.error('Failed to parse saved game config', e);
          }
        }
        
        try {
          const savedLanguage = localStorage.getItem('language');
          if (savedLanguage === 'ru' || savedLanguage === 'en' || savedLanguage === 'ua' || savedLanguage === 'pl') {
            setLocalLanguage(savedLanguage);
          }
        } catch (error) {
          console.error('Failed to load language:', error);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);
  
  useEffect(() => {
    setLocalLanguage(language);
  }, [language]);

  const handleNumberChange = (name: string, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAndSave = () => {
    let { rows, cols, mines } = localConfig;
    
    rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows));
    cols = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
    
    const maxMines = Math.floor((rows * cols) * 0.85);
    mines = Math.max(1, Math.min(maxMines, mines));

    const validatedConfig = { ...localConfig, rows, cols, mines, sounds: localSounds };
    
    try {
      localStorage.setItem('gameConfig', JSON.stringify(validatedConfig));
      prevConfigRef.current = JSON.stringify(validatedConfig);
      window.dispatchEvent(new CustomEvent('soundsChanged', { detail: localSounds }));
    } catch (error) {
      console.error('Failed to save game config:', error);
    }
    
    try {
      localStorage.setItem('language', localLanguage);
      setLanguage(localLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
    
    setLocalConfig(validatedConfig);
    
    onSave(validatedConfig);
    
    setToastMessage(t.settings.saved);
    setShowToast(true);
  };

  const handleSaveMultiplayer = async () => {
    
    try {
      localStorage.setItem('flagColor', flagColor);
      window.dispatchEvent(new CustomEvent('flagColorChanged', { detail: flagColor }));
    } catch (error) {
      console.error('Failed to save flag color:', error);
    }
    
    setToastMessage(t.settings.saved);
    setShowToast(true);
  };

  const handleLogout = async () => {
    logout();
    setPlayerName('Guest');
  };

  const handleAuthSuccess = async () => {
    if (user) {
      setPlayerName(user.username);
    }
  };

  return (
    <>
      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => {
          setShowToast(false);
          setToastMessage('');
        }}
      />
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-1.5 sm:p-4">
        <div className="bg-gradient-to-br from-[#8b6f47] to-[#6b4423] p-1 sm:p-1.5 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#a0826d]/20">
        <div className="flex flex-col items-center w-full p-2.5 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-2 border-[#4a3a27]/50 rounded-xl shadow-inner">
        <h2 className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-5 md:mb-6 text-[#f4e8c1] text-center font-pixel uppercase tracking-wider px-2">{t.settings.title}</h2>

        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6 w-full">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-pixel text-[10px] sm:text-xs md:text-sm transition-all duration-150 border-2 active:scale-95 shadow-lg ${
              activeTab === 'game'
                ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-[#9ccc65] text-white hover:from-[#558b2f] hover:to-[#33691e] shadow-[#7cb342]/30'
                : 'bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-[#6d5a3f] text-[#f4e8c1] hover:from-[#3a2817] hover:to-[#2a1810] shadow-black/30'
            }`}
          >
            {t.settings.game}
          </button>
          <button
            onClick={() => setActiveTab('multiplayer')}
            className={`flex-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-pixel text-[10px] sm:text-xs md:text-sm transition-all duration-150 border-2 active:scale-95 shadow-lg ${
              activeTab === 'multiplayer'
                ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-[#9ccc65] text-white hover:from-[#558b2f] hover:to-[#33691e] shadow-[#7cb342]/30'
                : 'bg-gradient-to-br from-[#5a4a2f] to-[#3a2817] border-[#6d5a3f] text-[#f4e8c1] hover:from-[#3a2817] hover:to-[#2a1810] shadow-black/30'
            }`}
          >
            {t.settings.multiplayer}
          </button>
        </div>

        {activeTab === 'game' && (
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 w-full">
            <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
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

            <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-xl p-3 sm:p-4">
              <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.settings.language}</div>
              <div className="flex gap-1.5 sm:gap-2 justify-center">
                <button 
                  onClick={() => setLocalLanguage('en')} 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg transition-all duration-150 min-w-[50px] sm:min-w-[60px] flex items-center justify-center ${
                    localLanguage === 'en' 
                      ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-2 border-[#9ccc65] shadow-[#7cb342]/50' 
                      : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] hover:from-[#8b6f47] hover:to-[#6b4423] border-2 border-[#4a3a27]'
                  }`}
                  title="English"
                >
                  <img src={`${baseUrl}flags/en.png`} alt="EN" className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded" />
                </button>
                <button 
                  onClick={() => setLocalLanguage('ru')} 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg transition-all duration-150 min-w-[50px] sm:min-w-[60px] flex items-center justify-center ${
                    localLanguage === 'ru' 
                      ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-2 border-[#9ccc65] shadow-[#7cb342]/50' 
                      : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] hover:from-[#8b6f47] hover:to-[#6b4423] border-2 border-[#4a3a27]'
                  }`}
                  title="Русский"
                >
                  <img src={`${baseUrl}flags/ru.png`} alt="RU" className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded" />
                </button>
                <button 
                  onClick={() => setLocalLanguage('ua')} 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg transition-all duration-150 min-w-[50px] sm:min-w-[60px] flex items-center justify-center ${
                    localLanguage === 'ua' 
                      ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-2 border-[#9ccc65] shadow-[#7cb342]/50' 
                      : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] hover:from-[#8b6f47] hover:to-[#6b4423] border-2 border-[#4a3a27]'
                  }`}
                  title="Українська"
                >
                  <img src={`${baseUrl}flags/ua.png`} alt="UA" className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded" />
                </button>
                <button 
                  onClick={() => setLocalLanguage('pl')} 
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-lg shadow-lg transition-all duration-150 min-w-[50px] sm:min-w-[60px] flex items-center justify-center ${
                    localLanguage === 'pl' 
                      ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-2 border-[#9ccc65] shadow-[#7cb342]/50' 
                      : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] hover:from-[#8b6f47] hover:to-[#6b4423] border-2 border-[#4a3a27]'
                  }`}
                  title="Polski"
                >
                  <img src={`${baseUrl}flags/pl.png`} alt="PL" className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded" />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
              <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.settings.sounds}</div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel flex-1 min-w-0">
                    {t.settings.victory || 'Victory'}
                  </label>
                  <button
                    onClick={() => {
                      setLocalSounds(prev => ({ ...prev, victory: !prev.victory }));
                    }}
                    className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border-2 transition-all duration-150 ${
                      localSounds.victory
                        ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-[#9ccc65] shadow-[#7cb342]/50'
                        : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] border-[#4a3a27] hover:from-[#8b6f47] hover:to-[#6b4423]'
                    }`}
                  >
                    {localSounds.victory && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[#6b4423] to-transparent"></div>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm text-[#f4e8c1] font-pixel flex-1 min-w-0">
                    {t.settings.defeat || 'Defeat'}
                  </label>
                  <button
                    onClick={() => {
                      setLocalSounds(prev => ({ ...prev, defeat: !prev.defeat }));
                    }}
                    className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border-2 transition-all duration-150 ${
                      localSounds.defeat
                        ? 'bg-gradient-to-br from-[#7cb342] to-[#558b2f] border-[#9ccc65] shadow-[#7cb342]/50'
                        : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] border-[#4a3a27] hover:from-[#8b6f47] hover:to-[#6b4423]'
                    }`}
                  >
                    {localSounds.defeat && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 w-full pt-2 px-0.5 sm:px-0">
              <PixelButton onClick={onBack} variant="secondary" className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0">
                {t.settings.back}
              </PixelButton>
              <PixelButton onClick={validateAndSave} className="flex-1 shadow-lg text-[9px] sm:text-[10px] px-2 sm:px-3 py-2 sm:py-2.5 min-w-0">
                {t.settings.save}
              </PixelButton>
            </div>
          </div>
        )}

        {activeTab === 'multiplayer' && (
          <>
            {!isAuthenticated ? (
              <div className="w-full space-y-4 sm:space-y-5 md:space-y-6 mb-4 sm:mb-5 md:mb-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm text-[#f4e8c1] text-center sm:text-left">{t.settings.playerName}</label>
                  <input
                    type="text"
                    value={playerName}
                    disabled
                    className="w-full bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-[#c5a572] cursor-not-allowed opacity-60"
                    placeholder={t.settings.playerName}
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 w-full min-w-0">
                  <PixelButton 
                    onClick={() => setShowRegisterModal(true)} 
                    className="flex-[1.5] shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0"
                  >
                    {t.auth.createAccount}
                  </PixelButton>
                  <PixelButton 
                    onClick={() => setShowLoginModal(true)} 
                    variant="secondary"
                    className="flex-1 shadow-lg text-[10px] sm:text-xs px-2 sm:px-3 py-2 sm:py-2.5 min-w-0"
                  >
                    {t.auth.login}
                  </PixelButton>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 sm:space-y-5 md:space-y-6 mb-4 sm:mb-5 md:mb-6">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm text-[#f4e8c1] text-center sm:text-left">{t.settings.playerName}</label>
                  <input
                    type="text"
                    value={playerName}
                    disabled
                    className="w-full bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-pixel text-xs sm:text-sm text-[#c5a572] cursor-not-allowed opacity-60"
                    placeholder={t.settings.playerName}
                  />
                  {isAuthenticated && (
                    <div className="text-[10px] sm:text-xs text-[#8b6f47] text-center">
                      {t.settings.nameCannotBeChanged}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-[#3a2817] to-[#2a1810] border-2 border-[#4a3a27] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="text-[10px] sm:text-xs text-[#c5a572] font-pixel uppercase mb-2 sm:mb-3 text-center">{t.settings.flagColor}</div>
                  <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                    {FLAG_COLORS.map((color, index) => (
                      <React.Fragment key={color.value}>
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div 
                              onClick={color.value === 'lime' ? () => setShowEasterEggModal(true) : undefined}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${color.gradient} border-2 ${color.border} flex items-center justify-center flex-shrink-0`}
                            >
                              <i className="fi fi-br-flag-alt text-white text-xs sm:text-sm"></i>
                            </div>
                            <label 
                              onClick={color.value === 'lime' ? () => setShowEasterEggModal(true) : undefined}
                              className="text-xs sm:text-sm text-[#f4e8c1] font-pixel flex-1 min-w-0"
                            >
                              {t.settings.colors[color.value as 'yellow' | 'red' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'cyan' | 'indigo' | 'teal' | 'emerald' | 'lime' | 'amber' | 'rose' | 'sky' | 'violet' | 'fuchsia']}
                            </label>
                          </div>
                          <button
                            onClick={() => setFlagColor(color.value)}
                            className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border-2 transition-all duration-150 ${
                              flagColor === color.value
                                ? `bg-gradient-to-br ${color.gradient} ${color.border} ${color.shadow}`
                                : 'bg-gradient-to-br from-[#6b4423] to-[#4a2f1a] border-[#4a3a27] hover:from-[#8b6f47] hover:to-[#6b4423]'
                            }`}
                          >
                            {flagColor === color.value && (
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {index < FLAG_COLORS.length - 1 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-[#6b4423] to-transparent"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-nowrap gap-1.5 sm:gap-2 md:gap-3 w-full px-0.5 sm:px-0">
              <PixelButton onClick={onBack} variant="secondary" className="flex-1 flex justify-center items-center gap-2 shadow-lg text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 min-w-0">
                {t.settings.back}
              </PixelButton>
              {isAuthenticated ? (
                <>
                  <PixelButton 
                    onClick={handleLogout} 
                    variant="secondary"
                    className="flex-1 shadow-lg text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 min-w-0"
                  >
                    {t.auth.logout}
                  </PixelButton>
                  <PixelButton onClick={handleSaveMultiplayer} className="flex-1 shadow-lg text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 min-w-0">
                    {t.settings.save}
                  </PixelButton>
                </>
              ) : null}
            </div>

            <Modal
              isOpen={showRegisterModal}
              onClose={() => setShowRegisterModal(false)}
              title={t.auth.register}
              showXButton={false}
              showCloseButton={false}
            >
              <RegisterModal
                onClose={() => setShowRegisterModal(false)}
                onSuccess={handleAuthSuccess}
              />
            </Modal>

            <Modal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              title={t.auth.login}
              showXButton={false}
              showCloseButton={false}
            >
              <LoginModal
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleAuthSuccess}
              />
            </Modal>

            <Modal
              isOpen={showEasterEggModal}
              onClose={() => setShowEasterEggModal(false)}
              title="BlabBlalb 🧠👴"
              showXButton={false}
              showCloseButton={true}
            >
              <div className="text-center">
                <p className="mb-4 text-2xl sm:text-3xl md:text-4xl">Blallbla 👴</p>
                <p className="text-sm text-[#c5a572] mb-6">Blaalblal 💚👴🧠</p>
              </div>
            </Modal>
          </>
        )}
        </div>
      </div>
      </div>
    </>
  );
};