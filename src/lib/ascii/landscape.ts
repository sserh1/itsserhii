// A flight over ridged mountains, drawn column by column like the old voxel
// space engines: march away from the camera, project each terrain sample and
// fill the rows it reveals, shaded by slope and faded with distance.
import { type Grid, hash, smooth } from './grid.ts';
import { RAMP, normalize } from './sdf.ts';

const LIGHT = normalize([-0.6, 0.55, -0.55]); // from the front left, so slopes facing us catch light
const SPEED = 3.5; // metres per second forwards
const FOCAL = 30; // in cell widths
const FOG: [number, number] = [18, 60];

/** Smooth value noise on the unit lattice. */
function noise(x: number, z: number) {
  const [ix, iz] = [Math.floor(x), Math.floor(z)];
  const [fx, fz] = [x - ix, z - iz];
  const [ux, uz] = [fx * fx * (3 - 2 * fx), fz * fz * (3 - 2 * fz)];
  const [a, b, c, d] = [hash(ix, iz), hash(ix + 1, iz), hash(ix, iz + 1), hash(ix + 1, iz + 1)];
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** The flight path: a winding valley floor. */
const path = (z: number) => 7 * Math.sin(z * 0.03);

/** Ridged fractal noise (sharp crests where the noise crosses its midpoint), flattened along the path. */
function height(x: number, z: number) {
  let h = 0;
  let amp = 1;
  let freq = 0.035;
  for (let octave = 0; octave < 3; octave++) {
    const ridge = 1 - Math.abs(noise(x * freq, z * freq) * 2 - 1);
    h += ridge * ridge * amp;
    amp *= 0.4;
    freq *= 2.1;
  }
  const side = smooth(Math.min(1, Math.abs(x - path(z)) / 14));
  return h * 11 * (0.35 + 0.65 * side);
}

export function drawLandscape(g: Grid, t: number) {
  const { cols, rows } = g;
  // Fly low along the valley, so the peaks on both sides rise over the horizon.
  const camZ = t * SPEED;
  const camX = path(camZ + 4);
  const camY = 11;
  const horizon = rows * 0.25;

  for (let col = 0; col < cols; col++) {
    const across = (col + 0.5 - cols / 2) / FOCAL;
    let lowest = rows; // first row (from the top) that is already drawn
    for (let z = 0.8; z < FOG[1]; z += 0.04 + z * 0.02) {
      const [x, wz] = [camX + across * z, camZ + z];
      const h = height(x, wz);
      // Each row is two cell widths tall.
      const top = Math.ceil(horizon - ((h - camY) / z) * (FOCAL / 2));
      if (top >= lowest) continue;

      const e = 0.25;
      const [nx, ny, nz] = normalize([height(x - e, wz) - height(x + e, wz), 2 * e, height(x, wz - e) - height(x, wz + e)]);
      const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const fog = Math.min(1, Math.max(0, (FOG[1] - z) / (FOG[1] - FOG[0])));
      const valley = 0.4 + 0.6 * Math.min(1, h / 8); // darker low ground, bright peaks
      const lum = (0.08 + 0.85 * lit) * fog * valley;
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))];
      for (let row = Math.max(0, top); row < lowest; row++) g.cells[row * cols + col] = ch;
      lowest = Math.max(0, top);
      if (lowest === 0) break;
    }
  }
}
