import { CellData } from '../../types.js';

export interface GameModeExtension {
  requiresSpecialLogic?(): boolean;
  onGameStart?(config: { rows: number; cols: number; mines: number }): void;
  onCellRevealed?(row: number, col: number, cell: CellData): void;
  onFlagPlaced?(row: number, col: number, cell: CellData): void;
  checkWinCondition?(cells: CellData[][], revealedCount: number, totalCells: number): boolean | null;
  checkLoseCondition?(cells: CellData[][], clickedMine: boolean): boolean | null;
  onGameEnd?(): void;
}