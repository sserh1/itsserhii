// Dev helper: prints scene frames to the terminal.
// node scripts/ascii-preview.ts <scene> [t1 t2 ...]
import { Grid } from '../src/lib/ascii/grid.ts';
import { SCENES } from '../src/lib/ascii/scenes.ts';

const [name = 'landscape', ...times] = process.argv.slice(2);
const scene = SCENES.find((s) => s.name === name);
if (!scene) throw new Error(`no scene ${name}; have ${SCENES.map((s) => s.name).join(', ')}`);

for (const t of times.length ? times.map(Number) : [0, 1.3, 2.6]) {
  const g = new Grid();
  scene.draw(g, t);
  console.log(`--- ${name} t=${t}`);
  console.log(g.toString().split('\n').map((l) => `|${l}|`).join('\n'));
}
