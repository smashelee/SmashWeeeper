const loseSounds = ['litvin.mp3', 'lobotomy.mp3', 'sigma.mp3'];
const winSounds = ['koleni.mp3'];

let soundsEnabled = true;
const activeAudioElements: HTMLAudioElement[] = [];

if (typeof window !== 'undefined') {
  const loadSoundsSetting = async () => {
    try {
      const { db } = await import('./database.js');
      await db.init();
      const saved = await db.getSetting('soundsEnabled');
      if (saved !== null) {
        soundsEnabled = saved === 'true';
      }
    } catch (error) {
      console.warn('Failed to load sounds setting:', error);
    }
  };
  
  loadSoundsSetting();
  
  window.addEventListener('soundsEnabledChanged', ((e: CustomEvent) => {
    soundsEnabled = e.detail;
  }) as EventListener);
}

export const isSoundsEnabled = (): boolean => soundsEnabled;

export const setSoundsEnabled = (enabled: boolean): void => {
  soundsEnabled = enabled;
};

export const playSound = (soundName: string, volume: number = 0.5): void => {
  if (!soundsEnabled) return;
  
  try {
    const baseUrl = (import.meta as any).env?.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanSound = soundName.startsWith('/') ? soundName.slice(1) : soundName;
    const soundPath = `${cleanBase}/sounds/${cleanSound}`;
    
    const audio = new Audio(soundPath);
    audio.volume = Math.max(0, Math.min(1, volume));
    
    activeAudioElements.push(audio);
    
    const removeAudio = () => {
      const index = activeAudioElements.indexOf(audio);
      if (index > -1) {
        activeAudioElements.splice(index, 1);
      }
    };
    
    audio.addEventListener('ended', removeAudio);
    audio.addEventListener('error', () => {
      removeAudio();
      const error = audio.error;
      if (error) {
        let errorMsg = 'Unknown error';
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = 'Aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Format not supported or file not found';
            break;
        }
        console.warn(`Failed to load sound: ${soundPath} (${errorMsg})`);
      }
    });
    
    audio.play().catch((error) => {
      removeAudio();
      console.warn('Failed to play sound:', error);
    });
  } catch (error) {
    console.warn('Failed to create audio:', error);
  }
};

export const stopAllSounds = (): void => {
  activeAudioElements.forEach(audio => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (error) {
      console.warn('Failed to stop sound:', error);
    }
  });
  activeAudioElements.length = 0;
};

export const playRandomLoseSound = (): void => {
  const randomSound = loseSounds[Math.floor(Math.random() * loseSounds.length)];
  playSound(`lose/${randomSound}`, 0.5);
};

export const playRandomWinSound = (): void => {
  const randomSound = winSounds[Math.floor(Math.random() * winSounds.length)];
  playSound(`win/${randomSound}`, 0.5);
};

export const playOpenCellSound = (): void => {
  // Будет позже
};

export const playOpenAreaSound = (): void => {
  // Будет позже
};

export const playSecretSound = (): void => {
  // Будет позже
};