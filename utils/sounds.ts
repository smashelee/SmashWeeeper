let winSoundEnabled = true;
let loseSoundEnabled = true;
const activeAudioElements: HTMLAudioElement[] = [];

if (typeof window !== 'undefined') {
  try {
    const savedWin = localStorage.getItem('winSoundEnabled');
    if (savedWin !== null) {
      winSoundEnabled = savedWin === 'true';
    }
    const savedLose = localStorage.getItem('loseSoundEnabled');
    if (savedLose !== null) {
      loseSoundEnabled = savedLose === 'true';
    }
  } catch (error) {
    console.warn('Failed to load sounds settings:', error);
  }
  
  window.addEventListener('winSoundEnabledChanged', ((e: CustomEvent) => {
    winSoundEnabled = e.detail;
    try {
      localStorage.setItem('winSoundEnabled', e.detail.toString());
    } catch (error) {
      console.warn('Failed to save win sound setting:', error);
    }
  }) as EventListener);
  
  window.addEventListener('loseSoundEnabledChanged', ((e: CustomEvent) => {
    loseSoundEnabled = e.detail;
    try {
      localStorage.setItem('loseSoundEnabled', e.detail.toString());
    } catch (error) {
      console.warn('Failed to save lose sound setting:', error);
    }
  }) as EventListener);
}

export const setWinSoundEnabled = (enabled: boolean): void => {
  winSoundEnabled = enabled;
};

export const setLoseSoundEnabled = (enabled: boolean): void => {
  loseSoundEnabled = enabled;
};

export const playSound = (soundName: string, volume: number = 0.5, checkEnabled: boolean = true): void => {
  if (!checkEnabled) return;
  
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

export const playLoseSound = (): void => {
  if (!loseSoundEnabled) return;
  playSound('lose/lose.mp3', 0.5, true);
};

export const playWinSound = (): void => {
  if (!winSoundEnabled) return;
  playSound('win/win.mp3', 0.5, true);
};