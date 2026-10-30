// People for the 3D scenes. A pose is a side view of the joints in "units"
// relative to the hip (x forward, y up, feet at y = -5); addBody turns it into
// round cones and spheres, spreading left and right limbs in depth.
import { smooth } from './grid.ts';
import type { Shapes, Vec } from './sdf.ts';

type Point = [number, number];

export type Pose = {
  hip: Point;
  neck: Point;
  head: Point;
  elbowF: Point;
  handF: Point;
  elbowB: Point;
  handB: Point;
  kneeF: Point;
  footF: Point;
  kneeB: Point;
  footB: Point;
};

export type BodyStyle = {
  gloves?: boolean;
  /** A skirt from waist to knee; the value flares it, e.g. while spinning. */
  skirt?: number;
  hair?: boolean;
  /** Rotation around the vertical axis, in radians. */
  turn?: number;
  scale?: number;
  /** Sideways offsets of the far (B) and near (F) feet, in metres, for side steps. */
  feet?: [number, number];
  /** Sideways shift of the hips, in metres. */
  sway?: number;
};

/** Metres per pose unit: a figure is about 1.8 m tall. */
export const UNIT = 0.165;

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  const out = {} as Pose;
  for (const key of Object.keys(a) as (keyof Pose)[]) {
    out[key] = [a[key][0] + (b[key][0] - a[key][0]) * k, a[key][1] + (b[key][1] - a[key][1]) * k];
  }
  return out;
}

/** Pose at time t from looping keyframes [[time, pose], ...] with the first key at 0. */
export function animate(keys: [number, Pose][], t: number, loop: number): Pose {
  const tt = ((t % loop) + loop) % loop;
  let i = keys.length - 1;
  while (i > 0 && keys[i][0] > tt) i--;
  const [t0, p0] = keys[i];
  const [t1, p1] = i + 1 < keys.length ? keys[i + 1] : [loop, keys[0][1]];
  return lerpPose(p0, p1, smooth((tt - t0) / (t1 - t0)));
}

/**
 * Adds a body standing at `base` (the point between the feet when they are at
 * y = -5) facing +x (facing 1) or -x (facing -1). F limbs are on the camera
 * side (+z), B limbs on the far side.
 */
export function addBody(s: Shapes, pose: Pose, base: Vec, facing: 1 | -1, style: BodyStyle = {}) {
  const k = style.scale ?? 1;
  const unit = UNIT * k;
  const [cos, sin] = [Math.cos(style.turn ?? 0), Math.sin(style.turn ?? 0)];
  const at = ([px, py]: Point, side = 0, up = 0): Vec => {
    const [lx, lz] = [px * unit, side * k];
    return [base[0] + facing * (lx * cos - lz * sin), base[1] + (py + 5 + up) * unit, base[2] + lx * sin + lz * cos];
  };
  // Chunky, clay-like proportions: at 72×24 cells thin limbs would be one character wide.
  const r = (m: number) => m * k * 1.35;
  const sway = style.sway ?? 0;
  const [feetB, feetF] = style.feet ?? [0, 0];

  const hip = at(pose.hip, sway);
  const chest = at(pose.neck, sway * 0.4, -0.7);
  s.add(hip, chest, r(0.12), r(0.16));
  s.add(at(pose.hip, sway + 0.09), at(pose.hip, sway - 0.09), r(0.12));
  s.add(chest, at(pose.head, 0, -0.6), r(0.055));
  s.sphere(at(pose.head), r(0.13));

  const limbs: [number, Point, Point, Point, Point, number][] = [
    [-1, pose.elbowB, pose.handB, pose.kneeB, pose.footB, feetB],
    [1, pose.elbowF, pose.handF, pose.kneeF, pose.footF, feetF],
  ];
  for (const [side, elbow, hand, knee, foot, step] of limbs) {
    const shoulder = at(pose.neck, sway * 0.4 + side * 0.17, -0.7);
    const e = at(elbow, side * 0.2);
    const h = at(hand, side * 0.12);
    s.add(shoulder, e, r(0.065), r(0.055));
    s.add(e, h, r(0.055), r(0.045));
    s.sphere(h, r(style.gloves ? 0.11 : 0.05));

    const kn = at(knee, side * 0.1 + (sway + step) / 2);
    const ft = at(foot, side * 0.1 + step);
    s.add(at(pose.hip, sway + side * 0.09), kn, r(0.09), r(0.07));
    s.add(kn, ft, r(0.07), r(0.055));
    s.add(ft, at([foot[0] + 0.9, foot[1] - 0.1], side * 0.1 + step), r(0.05));
  }

  if (style.skirt !== undefined) {
    s.add(at(pose.hip, sway, 0.5), at(pose.hip, sway, -2.4), r(0.12), r(0.3 + style.skirt * 0.2));
  }
  if (style.hair) {
    const back = at([pose.head[0] - 0.5, pose.head[1] + 0.1]);
    s.sphere(back, r(0.11));
    s.add(back, at([pose.head[0] - 0.8, pose.head[1] - 1.6]), r(0.08), r(0.04));
  }
}
