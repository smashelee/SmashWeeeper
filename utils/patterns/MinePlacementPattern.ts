import { CellData } from '../../types.js';

export interface MinePlacementPattern {
  placeMines(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][];
}