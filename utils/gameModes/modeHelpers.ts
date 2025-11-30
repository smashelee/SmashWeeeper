import { GameMode } from '../../types.js';
import { GameModeRegistry } from './GameModeRegistry.js';
import { getGameMode } from './index.js';

export function requiresSpecialLogic(gameMode: GameMode | string | undefined): boolean {
  if (!gameMode) return false;
  const mode = getGameMode(gameMode);
  return mode.requiresSpecialLogic();
}

export function getGameModeMetadata(gameMode: GameMode | string | undefined) {
  if (!gameMode) return null;
  return GameModeRegistry.getMetadata(gameMode);
}

export function isTimedMode(gameMode: GameMode | string | undefined): boolean {
  return gameMode === 'timed';
}

export function getGameModeTranslationKey(gameMode: GameMode | string | undefined): string {
  const metadata = getGameModeMetadata(gameMode);
  return metadata?.translationKey || 'modal.classic';
}