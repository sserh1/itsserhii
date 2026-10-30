// Looking into the barrel: a wave breaking towards -x, its lip curled over a
// tube that runs away from the camera, with the surfer riding out of it. The
// water is a height field, the lip a curled sheet, all lit like the donut.
import type { Grid } from './grid.ts';
import { clamp, smooth } from './grid.ts';
import { Shapes, render } from './sdf.ts';
import { addBody, animate, type Pose } from './body.ts';

const HEIGHT = 3.2; // of the wave, in metres
const MOUTH = 0.8; // z where the tube opens towards the camera
const LIP = { x: -1.2, y: HEIGHT - 1.0, r: 1.2, from: -1.2, to: 2.4 };

// Surf stance facing the way he rides: knees bent, arms out for balance.
const RIDE: Pose = {
  hip: [0, 0],
  neck: [0.7, 4.1],
  head: [1.0, 5.4],
  elbowF: [2.0, 3.5],
  handF: [3.4, 2.8],
  elbowB: [-1.1, 4.1],
  handB: [-2.5, 4.8],
  kneeF: [1.7, -2.0],
  footF: [2.2, -4.4],
  kneeB: [-0.9, -2.3],
  footB: [-2.2, -4.4],
};
const CARVE: Pose = {
  ...RIDE,
  neck: [-0.1, 4.3],
  head: [-0.1, 5.6],
  elbowF: [1.5, 4.5],
  handF: [2.9, 5.3],
  elbowB: [-1.6, 3.1],
  handB: [-3.0, 2.6],
  kneeF: [1.4, -2.2],
  kneeB: [-1.2, -2.0],
};
const STANCE: [number, Pose][] = [
  [0, RIDE],
  [1.1, CARVE],
];

/** Water height: a swell with a steep front (-x) that dies out just past the tube's mouth. */
function water(x: number, z: number, t: number) {
  const along = smooth(clamp((MOUTH + 1.8 - z) / 1.8));
  const swell = HEIGHT * along * Math.exp(-((x / (x < 0 ? 1.1 : 3.2)) ** 2));
  return swell + 0.07 * Math.sin(2.6 * x + 1.9 * z - 3.1 * t) + 0.05 * Math.sin(1.4 * x - 2.7 * z - 2.2 * t);
}

/** The lip: an arc around the tube in the x-y plane, open at the mouth. */
function lip(x: number, y: number, z: number, t: number) {
  const r = LIP.r * (1 + 0.04 * Math.sin(t * 2.2));
  const thick = 0.17;
  const [dx, dy] = [LIP.x - x, y - LIP.y]; // dx grows towards the front of the wave
  const angle = Math.atan2(dx, dy); // 0 points up, π/2 towards the front
  let d: number;
  if (angle > LIP.from && angle < LIP.to) {
    d = Math.abs(Math.hypot(dx, dy) - r) - thick;
  } else {
    const end = (a: number) => Math.hypot(dx - r * Math.sin(a), dy - r * Math.cos(a));
    d = Math.min(end(LIP.from), end(LIP.to)) - thick;
  }
  return Math.max(d, z - MOUTH);
}

export function drawSurf(g: Grid, t: number) {
  const surfer = new Shapes();
  // Riding inside the tube and out of its mouth, towards the camera.
  const x = LIP.x - 0.35 + 0.12 * Math.sin(t * 1.3);
  const z = 0.1 + 0.35 * Math.sin(t * 0.8);
  const board = (dz: number) => [x, water(x, z + dz, t) + 0.06, z + dz] as [number, number, number];
  surfer.add(board(-0.8), board(0.8), 0.06);
  addBody(surfer, animate(STANCE, t, 2.2), [x, water(x, z, t) + 0.12, z], 1, { scale: 0.8, turn: Math.PI / 2 });

  // Spray blown out of the tube's mouth.
  for (let i = 0; i < 8; i++) {
    const age = (t * 0.9 + i / 8) % 1;
    const a = LIP.to - 0.4 - (i % 4) * 0.5;
    surfer.sphere([LIP.x - Math.sin(a) * LIP.r, LIP.y + Math.cos(a) * LIP.r - age * 0.4, MOUTH + age * 1.4], 0.06);
  }

  render(g, {
    eye: [-2.2, 2.0, 8],
    target: [-1.0, 1.6, 0],
    zoom: 3.4,
    light: [0.5, 0.8, -0.3],
    sdf: (px, py, pz) => Math.min((py - water(px, pz, t)) * 0.5, lip(px, py, pz, t), surfer.dist(px, py, pz)),
    step: 0.8,
    far: 20,
    fog: [8, 17],
    // Keep the flat sea quiet and light the surfer up inside the dark tube.
    dim: (px, py, pz) => (surfer.dist(px, py, pz) < 0.05 ? 1.8 : Math.min(1, 0.4 + py * 0.5)),
  });
}
