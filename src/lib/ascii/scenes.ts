// The ASCII scenes shown on the home page, in order.
import type { Grid } from './grid.ts';
import { drawDonut } from './donut.ts';
import { drawLandscape } from './landscape.ts';
import { drawSurf } from './surf.ts';
import { drawBoxing } from './boxing.ts';
import { drawBachata } from './bachata.ts';

export type Scene = { name: string; draw: (g: Grid, t: number) => void };

export const SCENES: Scene[] = [
  { name: 'donut', draw: drawDonut },
  { name: 'landscape', draw: drawLandscape },
  { name: 'surf', draw: drawSurf },
  { name: 'boxing', draw: drawBoxing },
  { name: 'bachata', draw: drawBachata },
];
