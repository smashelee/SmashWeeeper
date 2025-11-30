import { BaseGameMode } from './BaseGameMode.js';
import { ClassicGameMode } from './ClassicGameMode.js';
import { GameModeRegistry } from './GameModeRegistry.js';
import { TimedExtension } from './extensions/index.js';
import { getPattern } from '../patterns/index.js';

GameModeRegistry.register(
  new ClassicGameMode(),
  {
    id: 'classic',
    translationKey: 'modal.classic',
    order: 1,
    availableInSingleplayer: true,
    availableInMultiplayer: true,
  }
);

GameModeRegistry.register(
  new ClassicGameMode(new TimedExtension()),
  {
    id: 'timed',
    translationKey: 'modal.timed',
    order: 2,
    availableInSingleplayer: true,
    availableInMultiplayer: true,
    requiresSpecialLogic: true,
  }
);

export function getGameMode(mode: string = 'classic', patternId?: string): BaseGameMode {
  const baseMode = GameModeRegistry.get(mode) || GameModeRegistry.get('classic')!;
  
  if (patternId) {
    const pattern = getPattern(patternId);
    if (pattern) {
      if (mode === 'timed') {
        return new ClassicGameMode(new TimedExtension(), pattern);
      } else {
        return new ClassicGameMode(undefined, pattern);
      }
    }
  }
  
  return baseMode;
}

export function getAllGameModes() {
  return GameModeRegistry.getAll();
}

export function getSingleplayerGameModes() {
  return GameModeRegistry.getSingleplayerModes();
}

export function getMultiplayerGameModes() {
  return GameModeRegistry.getMultiplayerModes();
}

export { BaseGameMode, ClassicGameMode };
export { GameModeRegistry };