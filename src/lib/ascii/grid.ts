// A fixed-size character canvas that the ASCII scenes draw into.
// Cells are twice as tall as they are wide.

export const COLS = 72;
export const ROWS = 24;

export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: string[];

  constructor(cols = COLS, rows = ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Array(cols * rows).fill(' ');
  }

  clear() {
    this.cells.fill(' ');
    return this;
  }

  set(x: number, y: number, ch: string) {
    const col = Math.round(x);
    const row = Math.round(y);
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) this.cells[row * this.cols + col] = ch;
  }

  toString() {
    const lines = [];
    for (let row = 0; row < this.rows; row++) lines.push(this.cells.slice(row * this.cols, (row + 1) * this.cols).join(''));
    return lines.join('\n');
  }
}

/** Deterministic 0..1 noise for an integer lattice point. */
export function hash(x: number, y = 0) {
  let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smooth = (k: number) => k * k * (3 - 2 * k);
