// Two boxers in a ring trading jabs and crosses, each slipping the other's punch.
import type { Grid } from './grid.ts';
import { Shapes, box, render, type Vec } from './sdf.ts';
import { addBody, animate, type Pose } from './body.ts';

const LOOP = 3;

// Poses face forward; the right boxer is mirrored.
const GUARD: Pose = {
  hip: [0, 0],
  neck: [0.5, 4.4],
  head: [0.8, 5.8],
  elbowF: [1.7, 3.0],
  handF: [2.3, 4.4],
  elbowB: [0.9, 2.7],
  handB: [1.5, 4.1],
  kneeF: [1.3, -2.4],
  footF: [1.9, -4.9],
  kneeB: [-1.0, -2.5],
  footB: [-1.9, -4.9],
};
const JAB: Pose = {
  ...GUARD,
  hip: [0.2, 0],
  neck: [1.0, 4.3],
  head: [1.4, 5.6],
  elbowF: [3.0, 4.0],
  handF: [5.0, 4.4],
  kneeF: [1.6, -2.4],
  footF: [2.1, -4.9],
};
const CROSS: Pose = {
  ...GUARD,
  hip: [0.3, 0],
  neck: [1.1, 4.2],
  head: [1.5, 5.5],
  elbowF: [1.6, 2.9],
  handF: [2.0, 4.1],
  elbowB: [2.7, 3.9],
  handB: [4.8, 4.3],
  kneeB: [-0.6, -2.3],
};
const SLIP: Pose = {
  ...GUARD,
  hip: [-0.3, -0.3],
  neck: [-0.4, 3.9],
  head: [-0.5, 5.2],
  elbowF: [0.9, 2.6],
  handF: [1.5, 3.9],
  elbowB: [0.2, 2.4],
  handB: [0.8, 3.7],
  kneeF: [1.2, -2.6],
  kneeB: [-1.2, -2.7],
};

const LEFT: [number, Pose][] = [
  [0, GUARD],
  [0.25, JAB],
  [0.5, GUARD],
  [1.0, GUARD],
  [1.25, SLIP],
  [1.5, GUARD],
  [2.0, GUARD],
  [2.25, CROSS],
  [2.55, GUARD],
];
const RIGHT: [number, Pose][] = [
  [0, GUARD],
  [0.25, SLIP],
  [0.5, GUARD],
  [1.0, GUARD],
  [1.25, JAB],
  [1.5, GUARD],
  [2.0, GUARD],
  [2.25, SLIP],
  [2.55, GUARD],
];

// Corner posts and ropes behind the fighters, on a raised canvas.
const ROPES = new Shapes();
for (const x of [-2.2, 2.2]) ROPES.add([x, 0, -1.3], [x, 1.35, -1.3], 0.06);
for (const y of [0.55, 0.85, 1.15]) ROPES.add([-2.2, y, -1.3], [2.2, y, -1.3], 0.035);
const CANVAS: [Vec, Vec] = [
  [-3, -0.5, -1.6],
  [3, 0, 1.6],
];

export function drawBoxing(g: Grid, t: number) {
  const fighters = new Shapes();
  const corners: [[number, Pose][], number, 1 | -1][] = [
    [LEFT, -0.62, 1],
    [RIGHT, 0.62, -1],
  ];
  corners.forEach(([keys, x, facing], i) => {
    const bounce = 0.05 * Math.abs(Math.sin((t + i * 0.2) * Math.PI * 2.4));
    addBody(fighters, animate(keys, t, LOOP), [x, bounce, 0], facing, { gloves: true });
  });

  render(g, {
    eye: [0.6, 1.25, 4.6],
    target: [0, 0.98, 0],
    zoom: 4.1,
    light: [-0.5, 0.85, 0.6],
    sdf: (x, y, z) => Math.min(box(x, y, z, ...CANVAS), ROPES.dist(x, y, z), fighters.dist(x, y, z)),
    shadowOn: (_x, y) => y < 0.02,
    dim: (_x, y) => (y < 0.02 ? 0.4 : 1),
    fog: [6, 9],
  });
}
