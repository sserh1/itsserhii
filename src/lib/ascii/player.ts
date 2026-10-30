// Plays the scenes into a <pre>: each runs for a few seconds, then morphs into the next.
import { Grid } from './grid.ts';
import { Morph } from './morph.ts';
import { SCENES } from './scenes.ts';

const SCENE_SECONDS = 5;
const MORPH_SECONDS = 1.4;
const FRAME_MS = 1000 / 30;

/** The first frame, also rendered at build time so the page doesn't jump. */
export function firstFrame() {
  const g = new Grid();
  SCENES[0].draw(g, 0);
  return g.toString();
}

export function play(pre: HTMLElement) {
  const grid = new Grid();
  let scene = 0;
  let time = 0;
  let morph: Morph | null = null;
  let morphTime = 0;
  let last = 0;
  let visible = true;

  // No point animating while the band is scrolled out of view.
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(pre);

  function step(dt: number) {
    if (morph) {
      morphTime += dt;
      morph.draw(grid, Math.min(morphTime / MORPH_SECONDS, 1));
      if (morphTime >= MORPH_SECONDS) {
        morph = null;
        time = 0;
      }
      return;
    }

    time += dt;
    SCENES[scene].draw(grid.clear(), time);
    if (time >= SCENE_SECONDS) {
      scene = (scene + 1) % SCENES.length;
      const next = new Grid();
      SCENES[scene].draw(next, 0);
      morph = new Morph(grid, next);
      morphTime = 0;
    }
  }

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!visible || now - last < FRAME_MS) return;
    // Cap the step so a background tab doesn't skip a whole scene on return.
    const dt = last ? Math.min(now - last, 100) / 1000 : 0;
    last = now;
    step(dt);
    pre.textContent = grid.toString();
  };
  requestAnimationFrame(tick);
}
