import { CellData } from '../../types.js';
import { GameModeExtension } from './GameModeExtension.js';
import { MinePlacementPattern } from '../patterns/MinePlacementPattern.js';
import { defaultPattern } from '../patterns/index.js';

export abstract class BaseGameMode {
  abstract name: string;
  
  extension?: GameModeExtension;
  pattern: MinePlacementPattern;

  constructor(extension?: GameModeExtension, pattern?: MinePlacementPattern) {
    this.extension = extension;
    this.pattern = pattern || defaultPattern;
  }

  requiresSpecialLogic(): boolean {
    return this.extension?.requiresSpecialLogic?.() ?? false;
  }
  
  createEmptyBoard(rows: number, cols: number): CellData[][] {
    const board: CellData[][] = [];
    for (let row = 0; row < rows; row++) {
      board[row] = [];
      for (let col = 0; col < cols; col++) {
        board[row][col] = {
          row,
          col,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        };
      }
    }
    return board;
  }

  abstract placeMines(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][];

  protected placeMinesBasic(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][] {
    return this.pattern.placeMines(board, mines, excludeRow, excludeCol, rows, cols);
  }
}