import { BaseGameMode } from './BaseGameMode.js';
import { CellData } from '../../types.js';
import { GameModeExtension } from './GameModeExtension.js';
import { MinePlacementPattern } from '../patterns/MinePlacementPattern.js';

export class ClassicGameMode extends BaseGameMode {
  name = 'classic';

  constructor(extension?: GameModeExtension, pattern?: MinePlacementPattern) {
    super(extension, pattern);
  }

  placeMines(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][] {
    return this.placeMinesBasic(board, mines, excludeRow, excludeCol, rows, cols);
  }
}