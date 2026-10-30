// Two dancers doing the bachata basic: three side steps and a tap with a hip
// pop, one way then back. In the second half of the first phrase the leader
// raises the joined hands and the follower spins under them.
import type { Grid } from './grid.ts';
import { clamp, smooth } from './grid.ts';
import { Shapes, render } from './sdf.ts';
import { UNIT, addBody, type Pose } from './body.ts';

const BEAT = 0.5;
const STEP = 0.2; // metres per side step

/**
 * Sideways (z) offsets of the -z foot, the +z foot and the hips at time t, the
 * foot that taps on counts 4 and 8, and the hip pop.
 */
function footwork(t: number) {
  const n = t / BEAT;
  const count = Math.floor(n) % 8;
  const f = n % 1;
  const lead = smooth(clamp(f * 2)); // the leading foot moves in the first half of the count
  const close = smooth(clamp(f * 2 - 1)); // the other one closes in the second half
  const pop = Math.sin(Math.PI * f);

  if (count < 3) {
    const base = -STEP * count;
    return { minus: base - STEP * lead, plus: base - STEP * close, hips: base - STEP * smooth(f), tap: 0, pop: 0 };
  }
  if (count === 3) return { minus: -3 * STEP, plus: -3 * STEP, hips: -3 * STEP, tap: 1, pop: -pop };
  if (count < 7) {
    const base = -3 * STEP + STEP * (count - 4);
    return { minus: base + STEP * close, plus: base + STEP * lead, hips: base + STEP * smooth(f), tap: 0, pop: 0 };
  }
  return { minus: 0, plus: 0, hips: 0, tap: -1, pop };
}

/** A dancer standing at x, with the near (F) hand reaching the world point `hand`. */
function dancerPose(x: number, facing: 1 | -1, hand: [number, number], back: [number, number], tap: number, f: number): Pose {
  const local = (wx: number) => ((wx - x) * facing) / UNIT;
  const handF: [number, number] = [local(hand[0]), hand[1] / UNIT - 5];
  const neck: [number, number] = [0.2, 4.4];
  const lift = (side: number) => (tap === side ? Math.sin(Math.PI * f) * 0.8 : 0);
  return {
    hip: [0, 0],
    neck,
    head: [0.35, 5.8],
    handF,
    elbowF: [(neck[0] + handF[0]) / 2 + 0.2, (neck[1] + handF[1]) / 2 - 0.9],
    handB: back,
    elbowB: [(neck[0] + back[0]) / 2 - 0.4, (neck[1] + back[1]) / 2 - 0.5],
    footF: [0.3, -5 + lift(1)],
    kneeF: [0.6 + lift(1) * 0.8, -2.5 + lift(1) * 0.4],
    footB: [0.3, -5 + lift(-1)],
    kneeB: [0.6 + lift(-1) * 0.8, -2.5 + lift(-1) * 0.4],
  };
}

export function drawBachata(g: Grid, t: number) {
  const steps = footwork(t);
  const f = (t / BEAT) % 1;
  // Underarm turn on counts 5-8 of the first phrase: the hands go up, the
  // follower spins once and the pair closes in a little.
  const turn = clamp((t - 4 * BEAT) / (4 * BEAT));
  const spinning = turn > 0 && turn < 1;
  const up = Math.sin(Math.PI * turn);
  const leadX = -0.42 + 0.1 * up;
  const followX = 0.42 - 0.1 * up;
  const hand: [number, number] = spinning ? [followX - 0.06, 1.05 + 0.85 * up] : [0, 1.05];
  const feet: [number, number] = [steps.minus - steps.hips, steps.plus - steps.hips];
  const sway = steps.pop * 0.05;

  const people = new Shapes();
  addBody(people, dancerPose(leadX, 1, hand, [0.6, 0.9], steps.tap, f), [leadX, 0, steps.hips], 1, { feet, sway });
  addBody(people, dancerPose(followX, -1, hand, [-1.6, 4.6], steps.tap, f), [followX, 0, steps.hips], -1, {
    feet,
    sway: -sway,
    skirt: up,
    hair: true,
    turn: 2 * Math.PI * smooth(turn),
  });

  render(g, {
    eye: [1.7, 1.25, 4.3],
    target: [0, 0.95, -0.2],
    zoom: 3.9,
    light: [-0.4, 0.9, 0.5],
    // A round dance floor under the pair.
    sdf: (x, y, z) => Math.min(Math.max(Math.hypot(x, z + 0.3) - 1.9, y, -0.15 - y), people.dist(x, y, z)),
    shadowOn: (_x, y) => y < 0.02,
    dim: (_x, y) => (y < 0.02 ? 0.4 : 1),
  });
}
