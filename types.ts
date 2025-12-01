export type GameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'timeout';

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  flaggedBy?: string;
}

export type GameMode = 'classic' | 'timed';
export type PatternId = 'default' | 'lines';

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
  gameMode?: GameMode;
  pattern?: PatternId;
  sounds?: {
    victory: boolean;
    defeat: boolean;
  };
}

export enum AppScreen {
  MENU = 'MENU',
  GAME = 'GAME',
  SETTINGS = 'SETTINGS'
}