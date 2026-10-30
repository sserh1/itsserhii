// Transition between two frames: every character of the old frame flies along
// a small arc to a cell of the new one and swaps its glyph halfway.
import { Grid, clamp, hash } from './grid.ts';

type Cell = { x: number; y: number; ch: string };
type Particle = { from: Cell; to: Cell; delay: number; arc: number };

const STAGGER = 0.35; // share of the transition over which particles set off
const ease = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

/** Non-blank cells in column order, so the pairing sweeps left to right. */
function cellsOf(g: Grid): Cell[] {
  const cells: Cell[] = [];
  for (let x = 0; x < g.cols; x++) {
    for (let y = 0; y < g.rows; y++) {
      const ch = g.cells[y * g.cols + x];
      if (ch !== ' ') cells.push({ x, y, ch });
    }
  }
  return cells;
}

export class Morph {
  private readonly particles: Particle[];

  constructor(from: Grid, to: Grid) {
    const a = cellsOf(from);
    const b = cellsOf(to);
    const n = Math.max(a.length, b.length);
    // The larger frame gets one particle per character; the smaller one's
    // characters split or merge to match.
    this.particles = Array.from({ length: n }, (_, k) => {
      const src = a[Math.floor((k * a.length) / n)];
      const dst = b[Math.floor((k * b.length) / n)];
      return {
        from: src ?? { ...dst, ch: ' ' },
        to: dst ?? { ...src, ch: ' ' },
        delay: hash(k, 1) * STAGGER,
        arc: 1 + hash(k, 2) * 3,
      };
    });
  }

  /** Draws the transition at `progress` from 0 (old frame) to 1 (new frame). */
  draw(g: Grid, progress: number) {
    g.clear();
    for (const { from, to, delay, arc } of this.particles) {
      const k = clamp((progress - delay) / (1 - STAGGER));
      const e = ease(k);
      const ch = k < 0.5 ? from.ch : to.ch;
      if (ch === ' ') continue;
      g.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * arc, ch);
    }
  }
}
