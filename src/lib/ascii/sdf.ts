// A small signed-distance raymarcher for the ASCII scenes. Everything is lit
// by one sun and shaded with the donut's character ramp, so shapes read as
// solid objects rather than outlines.
import type { Grid } from './grid.ts';

export type Vec = [number, number, number];
export type Sdf = (x: number, y: number, z: number) => number;

export const RAMP = '.,-~:;=!*#$@';

export function normalize([x, y, z]: Vec): Vec {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/** Round cone from a (radius ra) to b (radius rb); a capsule when ra = rb. After Inigo Quilez. */
export function roundCone(
  px: number,
  py: number,
  pz: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  r1: number,
  r2: number,
) {
  const [bax, bay, baz] = [bx - ax, by - ay, bz - az];
  const [pax, pay, paz] = [px - ax, py - ay, pz - az];
  const l2 = bax * bax + bay * bay + baz * baz;
  if (l2 < 1e-9) return Math.sqrt(pax * pax + pay * pay + paz * paz) - r1;
  const y = pax * bax + pay * bay + paz * baz;
  if (r1 === r2) {
    const h = Math.min(1, Math.max(0, y / l2));
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r1;
  }
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  const z = y - l2;
  const [qx, qy, qz] = [pax * l2 - bax * y, pay * l2 - bay * y, paz * l2 - baz * y];
  const x2 = qx * qx + qy * qy + qz * qz;
  const y2 = y * y * l2;
  const z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

/** Axis-aligned box given by its corners. */
export function box(x: number, y: number, z: number, min: Vec, max: Vec) {
  const dx = Math.max(min[0] - x, x - max[0]);
  const dy = Math.max(min[1] - y, y - max[1]);
  const dz = Math.max(min[2] - z, z - max[2]);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
  return outside + Math.min(Math.max(dx, dy, dz), 0);
}

/** A bag of round cones and spheres with a bounding box to skip them cheaply. */
export class Shapes {
  private readonly data: number[] = [];
  private readonly min: Vec = [Infinity, Infinity, Infinity];
  private readonly max: Vec = [-Infinity, -Infinity, -Infinity];

  add(a: Vec, b: Vec, ra: number, rb = ra) {
    this.data.push(a[0], a[1], a[2], b[0], b[1], b[2], ra, rb);
    const r = Math.max(ra, rb);
    for (let i = 0; i < 3; i++) {
      this.min[i] = Math.min(this.min[i], a[i] - r, b[i] - r);
      this.max[i] = Math.max(this.max[i], a[i] + r, b[i] + r);
    }
    return this;
  }

  sphere(c: Vec, r: number) {
    return this.add(c, c, r);
  }

  dist(x: number, y: number, z: number) {
    const bound = box(x, y, z, this.min, this.max);
    if (bound > 0.25) return bound;
    let best = Infinity;
    const d = this.data;
    for (let i = 0; i < d.length; i += 8) {
      best = Math.min(best, roundCone(x, y, z, d[i], d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6], d[i + 7]));
    }
    return best;
  }
}

export type View = {
  eye: Vec;
  target: Vec;
  /** Focal length; the frame's half-height is 1, its half-width 1.5 (72×24 cells). */
  zoom: number;
  /** Direction towards the sun. */
  light: Vec;
  sdf: Sdf;
  far?: number;
  /** Distance range over which surfaces fade into the background. */
  fog?: [number, number];
  /** Soft shadows on surfaces for which this returns true (e.g. the floor). */
  shadowOn?: (x: number, y: number, z: number) => boolean;
  /** Brightness multiplier per surface point, to keep big backdrops quiet. */
  dim?: (x: number, y: number, z: number) => number;
  /** Ray-march step scale; below 1 for distance fields that overestimate, like height fields. */
  step?: number;
};

export function render(g: Grid, v: View) {
  const { cols, rows } = g;
  const far = v.far ?? 30;
  const step = v.step ?? 1;
  const light = normalize(v.light);
  const f = normalize([v.target[0] - v.eye[0], v.target[1] - v.eye[1], v.target[2] - v.eye[2]]);
  const r = normalize([-f[2], 0, f[0]]); // f × up
  const u: Vec = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const [ex, ey, ez] = v.eye;
  const sdf = v.sdf;

  for (let row = 0; row < rows; row++) {
    // Cells are twice as tall as wide: the frame is `rows` widths high on each side of center.
    const sy = ((rows / 2 - row - 0.5) * 2) / rows;
    for (let col = 0; col < cols; col++) {
      const sx = (col + 0.5 - cols / 2) / rows;
      const [dx, dy, dz] = normalize([
        f[0] * v.zoom + r[0] * sx + u[0] * sy,
        f[1] * v.zoom + r[1] * sx + u[1] * sy,
        f[2] * v.zoom + r[2] * sx + u[2] * sy,
      ]);

      let t = 0.05;
      let hit = false;
      for (let i = 0; i < 80 && t < far; i++) {
        const d = sdf(ex + dx * t, ey + dy * t, ez + dz * t);
        if (d < 0.002 + 0.0015 * t) {
          hit = true;
          break;
        }
        t += d * step;
      }
      if (!hit) continue;

      const [px, py, pz] = [ex + dx * t, ey + dy * t, ez + dz * t];
      // Normal from four samples on a tetrahedron.
      const e = 0.004 + 0.001 * t;
      const a = sdf(px + e, py - e, pz - e);
      const b = sdf(px - e, py - e, pz + e);
      const c = sdf(px - e, py + e, pz - e);
      const d = sdf(px + e, py + e, pz + e);
      const [nx, ny, nz] = normalize([a - b - c + d, -a - b + c + d, -a + b - c + d]);

      let lit = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
      if (lit > 0 && v.shadowOn?.(px, py, pz)) lit *= softShadow(sdf, px + nx * 0.02, py + ny * 0.02, pz + nz * 0.02, light);
      // Key light from the sun, a soft fill from the camera so shaded sides
      // keep their form, and a rim that brightens silhouettes.
      const facing = Math.max(0, -(nx * dx + ny * dy + nz * dz));
      const rim = (1 - facing) ** 3 * 0.2;
      let lum = 0.06 + 0.7 * lit + 0.3 * facing * facing + rim;
      if (v.dim) lum *= v.dim(px, py, pz);
      if (v.fog) lum *= Math.min(1, Math.max(0, (v.fog[1] - t) / (v.fog[1] - v.fog[0])));
      if (lum <= 0.02) continue;
      g.cells[row * cols + col] = RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))];
    }
  }
}

function softShadow(sdf: Sdf, x: number, y: number, z: number, [lx, ly, lz]: Vec) {
  let res = 1;
  let t = 0.02;
  for (let i = 0; i < 24 && t < 4; i++) {
    const d = sdf(x + lx * t, y + ly * t, z + lz * t);
    if (d < 0.001) return 0.2;
    res = Math.min(res, (8 * d) / t);
    t += Math.max(d, 0.03);
  }
  return 0.2 + 0.8 * Math.max(0, res);
}
