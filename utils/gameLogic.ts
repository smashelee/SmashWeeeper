import { CellData } from '../types.js';

export const createEmptyBoard = (rows: number, cols: number): CellData[][] => {
  const board: CellData[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
};

export const getNeighbors = (row: number, col: number, rows: number, cols: number): [number, number][] => {
  const neighbors: [number, number][] = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols && !(r === row && c === col)) {
        neighbors.push([r, c]);
      }
    }
  }
  return neighbors;
};

export const placeMines = (
  board: CellData[][],
  mines: number,
  safeRow: number,
  safeCol: number
): CellData[][] => {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  const safeZone = new Set<string>();
  safeZone.add(`${safeRow},${safeCol}`);
  getNeighbors(safeRow, safeCol, rows, cols).forEach(([r, c]) => {
    safeZone.add(`${r},${c}`);
  });

  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (!newBoard[r][c].isMine && !safeZone.has(`${r},${c}`)) {
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        getNeighbors(r, c, rows, cols).forEach(([nr, nc]) => {
          if (newBoard[nr][nc].isMine) count++;
        });
        newBoard[r][c].neighborMines = count;
      }
    }
  }

  return newBoard;
};

export const revealCell = (board: CellData[][], row: number, col: number): CellData[][] => {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [currRow, currCol] = stack.pop()!;
    const cell = newBoard[currRow][currCol];

    if (cell.isRevealed || cell.isFlagged) continue;

    cell.isRevealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      const neighbors = getNeighbors(currRow, currCol, rows, cols);
      for (const [nr, nc] of neighbors) {
        if (!newBoard[nr][nc].isRevealed) {
          stack.push([nr, nc]);
        }
      }
    }
  }

  return newBoard;
};

export const checkWin = (board: CellData[][], totalMines: number): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  let revealedCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isRevealed) {
        revealedCount++;
      } else if (!board[r][c].isMine) {
        return false;
      }
    }
  }
  
  return revealedCount === (rows * cols - totalMines);
};

export const revealAllMines = (board: CellData[][]): CellData[][] => {
  return board.map(row => row.map(cell => {
    if (cell.isMine) {
      return { ...cell, isRevealed: true };
    }
    return cell;
  }));
};