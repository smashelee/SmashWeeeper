import { MinePlacementPattern } from './MinePlacementPattern.js';
import { CellData } from '../../types.js';

export const defaultPattern: MinePlacementPattern = {
  placeMines(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][] {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    let minesPlaced = 0;
    
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (
        !newBoard[row][col].isMine &&
        !(row === excludeRow && col === excludeCol) &&
        !(Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1)
      ) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              if (
                nr >= 0 && nr < rows &&
                nc >= 0 && nc < cols &&
                newBoard[nr][nc].isMine
              ) {
                count++;
              }
            }
          }
          newBoard[row][col].neighborMines = count;
        }
      }
    }
    
    return newBoard;
  }
};