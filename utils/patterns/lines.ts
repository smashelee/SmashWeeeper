import { MinePlacementPattern } from './MinePlacementPattern.js';
import { CellData } from '../../types.js';

export const linesPattern: MinePlacementPattern = {
  placeMines(
    board: CellData[][],
    mines: number,
    excludeRow: number,
    excludeCol: number,
    rows: number,
    cols: number
  ): CellData[][] {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    
    const safeZone = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = excludeRow + dr;
        const nc = excludeCol + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safeZone.add(`${nr},${nc}`);
        }
      }
    }

    const isValid = (r: number, c: number) => {
      return r >= 0 && r < rows && c >= 0 && c < cols && !newBoard[r][c].isMine && !safeZone.has(`${r},${c}`);
    };

    const bresenhamLine = (r0: number, c0: number, r1: number, c1: number): Array<{r: number, c: number}> => {
      const line: Array<{r: number, c: number}> = [];
      const dr = Math.abs(r1 - r0);
      const dc = Math.abs(c1 - c0);
      const sr = r0 < r1 ? 1 : -1;
      const sc = c0 < c1 ? 1 : -1;
      let err = dc - dr;
      
      let r = r0;
      let c = c0;
      
      while (true) {
        if (!safeZone.has(`${r},${c}`)) {
          line.push({ r, c });
        }
        
        if (r === r1 && c === c1) break;
        
        const e2 = 2 * err;
        if (e2 > -dr) {
          err -= dr;
          c += sc;
        }
        if (e2 < dc) {
          err += dc;
          r += sr;
        }
      }
      
      return line;
    };

    const createDiagonalLine = (startR: number, startC: number, dirR: number, dirC: number): Array<{r: number, c: number}> => {
      const line: Array<{r: number, c: number}> = [];
      let r = startR;
      let c = startC;
      
      while (r >= 0 && r < rows && c >= 0 && c < cols) {
        if (!safeZone.has(`${r},${c}`)) {
          line.push({ r, c });
        }
        r += dirR;
        c += dirC;
      }
      
      return line;
    };

    const createCornerToCornerLine = (): Array<{r: number, c: number}> | null => {
      const corners = [
        { r: 0, c: 0, name: 'TL' },
        { r: 0, c: cols - 1, name: 'TR' },
        { r: rows - 1, c: 0, name: 'BL' },
        { r: rows - 1, c: cols - 1, name: 'BR' }
      ];
      
      const start = corners[Math.floor(Math.random() * corners.length)];
      const end = corners[Math.floor(Math.random() * corners.length)];
      
      if (start.name === end.name) return null;
      
      return bresenhamLine(start.r, start.c, end.r, end.c);
    };

    const usedLines = new Set<string>();
    let minesPlaced = 0;
    let attempts = 0;
    
    const createStarBurst = (): Array<{r: number, c: number}> => {
      const centerR = Math.floor(rows / 2);
      const centerC = Math.floor(cols / 2);
      const numRays = 6 + Math.floor(Math.random() * 6);
      const allPoints: Array<{r: number, c: number}> = [];
      
      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const length = Math.min(rows, cols) * 0.8;
        const endR = Math.round(centerR + Math.sin(angle) * length);
        const endC = Math.round(centerC + Math.cos(angle) * length);
        
        const ray = bresenhamLine(centerR, centerC, endR, endC);
        allPoints.push(...ray);
      }
      
      return allPoints;
    };

    const specialEvent = Math.random();
    if (specialEvent < 0.12) {
      const cornerLine = createCornerToCornerLine();
      if (cornerLine) {
        for (const pos of cornerLine) {
          if (isValid(pos.r, pos.c) && minesPlaced < mines) {
            newBoard[pos.r][pos.c].isMine = true;
            minesPlaced++;
          }
        }
      }
    } else if (specialEvent < 0.25) {
      const starburst = createStarBurst();
      for (const pos of starburst) {
        if (isValid(pos.r, pos.c) && minesPlaced < mines) {
          newBoard[pos.r][pos.c].isMine = true;
          minesPlaced++;
        }
      }
    }

    while (minesPlaced < mines && attempts < 300) {
      const lineStyle = Math.random();
      let line: Array<{r: number, c: number}> = [];
      let lineKey = '';
      
      if (lineStyle < 0.3) {
        const col = Math.floor(Math.random() * cols);
        const fromTop = Math.random() > 0.5;
        line = createDiagonalLine(
          fromTop ? 0 : rows - 1,
          col,
          fromTop ? 1 : -1,
          0
        );
        lineKey = `v-${col}`;
      }
      else if (lineStyle < 0.6) {
        const row = Math.floor(Math.random() * rows);
        const fromLeft = Math.random() > 0.5;
        line = createDiagonalLine(
          row,
          fromLeft ? 0 : cols - 1,
          0,
          fromLeft ? 1 : -1
        );
        lineKey = `h-${row}`;
      }
      else if (lineStyle < 0.8) {
        const startEdge = Math.floor(Math.random() * 4);
        let startR = 0, startC = 0, dirR = 0, dirC = 0;
        
        if (startEdge === 0) {
          startR = 0;
          startC = Math.floor(Math.random() * cols);
          dirR = 1;
          dirC = Math.random() > 0.5 ? 1 : -1;
          lineKey = `d1-${startC}`;
        } else if (startEdge === 1) {
          startR = rows - 1;
          startC = Math.floor(Math.random() * cols);
          dirR = -1;
          dirC = Math.random() > 0.5 ? 1 : -1;
          lineKey = `d2-${startC}`;
        } else if (startEdge === 2) {
          startR = Math.floor(Math.random() * rows);
          startC = 0;
          dirR = Math.random() > 0.5 ? 1 : -1;
          dirC = 1;
          lineKey = `d3-${startR}`;
        } else {
          startR = Math.floor(Math.random() * rows);
          startC = cols - 1;
          dirR = Math.random() > 0.5 ? 1 : -1;
          dirC = -1;
          lineKey = `d4-${startR}`;
        }
        
        line = createDiagonalLine(startR, startC, dirR, dirC);
      }
      else {
        const edges = [
          { r: 0, c: Math.floor(Math.random() * cols) },
          { r: rows - 1, c: Math.floor(Math.random() * cols) },
          { r: Math.floor(Math.random() * rows), c: 0 },
          { r: Math.floor(Math.random() * rows), c: cols - 1 }
        ];
        
        const start = edges[Math.floor(Math.random() * edges.length)];
        const end = edges[Math.floor(Math.random() * edges.length)];
        
        line = bresenhamLine(start.r, start.c, end.r, end.c);
        lineKey = `b-${start.r}-${start.c}-${end.r}-${end.c}`;
      }
      
      if (usedLines.has(lineKey) || line.length === 0) {
        attempts++;
        continue;
      }
      
      usedLines.add(lineKey);
      
      let placedInLine = 0;
      for (const pos of line) {
        if (isValid(pos.r, pos.c) && minesPlaced < mines) {
          newBoard[pos.r][pos.c].isMine = true;
          minesPlaced++;
          placedInLine++;
        }
      }
      
      if (placedInLine > 0) {
        attempts = 0;
      } else {
        attempts++;
      }
    }

    if (minesPlaced < mines) {
      const available: Array<{ row: number; col: number }> = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (isValid(r, c)) {
            available.push({ row: r, col: c });
          }
        }
      }
      
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      
      for (const { row, col } of available) {
        if (minesPlaced >= mines) break;
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    const countNeighborMines = (r: number, c: number): number => {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      return count;
    };

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newBoard[row][col].isMine) {
          newBoard[row][col].neighborMines = countNeighborMines(row, col);
        }
      }
    }

    return newBoard;
  }
};