// The classic spinning ASCII donut (Andy Sloane's donut.c).
import type { Grid } from './grid.ts';

const SHADES = '.,-~:;=!*#$@';

export function drawDonut(g: Grid, t: number) {
  const a = 1 + t * 0.8;
  const b = 1 + t * 0.4;
  const { cols, rows } = g;
  const R1 = 1; // tube radius
  const R2 = 2; // distance from the center to the tube
  const K2 = 5; // distance from the viewer
  // Projection scale. Over all rotations the donut spans up to 1.52·K1 columns
  // and 0.76·K1 rows, so this keeps every frame inside the grid.
  const K1 = Math.min((cols - 2) / 1.52, (rows - 1) / 0.76);

  const depth = new Float64Array(cols * rows);
  const [cA, sA, cB, sB] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b)];

  for (let theta = 0; theta < 2 * Math.PI; theta += 0.07) {
    const [ct, st] = [Math.cos(theta), Math.sin(theta)];
    const cx = R2 + R1 * ct;
    const cy = R1 * st;

    for (let phi = 0; phi < 2 * Math.PI; phi += 0.02) {
      const [cp, sp] = [Math.cos(phi), Math.sin(phi)];
      const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
      const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
      const ooz = 1 / (K2 + cA * cx * sp + cy * sA);
      // Characters are twice as tall as they are wide, hence K1 / 2 for rows.
      const col = Math.floor(cols / 2 + K1 * ooz * x);
      const row = Math.floor(rows / 2 - (K1 / 2) * ooz * y);
      const light = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);

      if (light <= 0 || col < 0 || col >= cols || row < 0 || row >= rows) continue;
      const i = col + row * cols;
      if (ooz > depth[i]) {
        depth[i] = ooz;
        g.cells[i] = SHADES[Math.floor(light * 8)];
      }
    }
  }
}
