import type { Occasion } from './occasions';

export type Enter = 'grow' | 'rise' | 'up' | 'across' | 'open';

export type Shape = {
  tag: 'circle' | 'path' | 'rect';
  attrs: Record<string, string | number>;
  order: number;
  enter: Enter;
};

const EGG = '#f4f1d0';
const egg = (opacity = 1) => ({ fill: EGG, ...(opacity < 1 && { 'fill-opacity': opacity }) });
const shade = (opacity: number) => ({ fill: '#000', 'fill-opacity': opacity });
const stroke = (width: number) => ({
  fill: 'none',
  stroke: EGG,
  'stroke-width': width,
  'stroke-linecap': 'round',
});

const shape = (
  tag: Shape['tag'],
  attrs: Shape['attrs'],
  order: number,
  enter: Enter = 'grow'
): Shape => ({ tag, attrs, order, enter });

const lash = (d: string, order: number) => shape('path', { d, ...stroke(8) }, order);

const BEADS = 33;
const LIT = 11;

const misbaha: Shape[] = Array.from({ length: BEADS }, (_, index) => {
  const angle = ((75 - (index * 330) / (BEADS - 1)) * Math.PI) / 180;
  return shape(
    'circle',
    {
      cx: (120 + 78 * Math.cos(angle)).toFixed(1),
      cy: (104 + 78 * Math.sin(angle)).toFixed(1),
      r: 6.5,
      ...(index < LIT ? egg() : shade(0.22)),
    },
    Math.floor(index / 3) / 2
  );
});

const PRAYERS = [
  { x: 190, top: 128, opacity: 0.35 },
  { x: 146, top: 108, opacity: 0.55 },
  { x: 102, top: 84, opacity: 1 },
  { x: 58, top: 108, opacity: 0.55 },
  { x: 14, top: 128, opacity: 0.35 },
];

export const EMBLEMS: Record<Occasion, Shape[]> = {
  'sabah-masaa': [
    shape('circle', { cx: 120, cy: 120, r: 112, ...shade(0.1) }, 0),
    shape('rect', { x: 16, y: 128, width: 208, height: 6, ...egg() }, 0.5, 'across'),
    shape('path', { d: 'M64 128a56 56 0 0 1 112 0z', ...egg() }, 1, 'rise'),
    shape('rect', { x: 48, y: 150, width: 144, height: 6, ...egg(0.5) }, 2, 'across'),
    shape('rect', { x: 72, y: 168, width: 96, height: 6, ...egg(0.35) }, 2.5, 'across'),
    shape('rect', { x: 96, y: 186, width: 48, height: 6, ...egg(0.2) }, 3, 'across'),
  ],
  salah: [
    shape('rect', { x: 8, y: 204, width: 224, height: 10, ...shade(0.22) }, 0, 'across'),
    ...PRAYERS.map(({ x, top, opacity }, index) =>
      shape(
        'path',
        { d: `M${x} 204V${top}a18 18 0 0 1 36 0V204z`, ...egg(opacity) },
        1 + index / 2,
        'up'
      )
    ),
  ],
  nawm: [
    shape('circle', { cx: 120, cy: 120, r: 112, ...shade(0.1) }, 0),
    shape('path', { d: 'M120 36a84 84 0 1 0 84 84a66 66 0 0 1-84-84z', ...egg() }, 1, 'rise'),
    shape('circle', { cx: 172, cy: 62, r: 7, ...egg() }, 2),
    shape('circle', { cx: 198, cy: 92, r: 4, ...egg() }, 3),
  ],
  istiqaz: [
    shape('circle', { cx: 120, cy: 120, r: 112, ...shade(0.1) }, 0),
    shape('path', { d: 'M24 120q96-76 192 0q-96 76-192 0z', ...egg() }, 1, 'open'),
    shape('circle', { cx: 120, cy: 120, r: 30, ...shade(0.35) }, 2),
    shape('circle', { cx: 131, cy: 109, r: 8, ...egg() }, 2.5),
    lash('M120 68L120 46', 3),
    lash('M80 76L70 56', 3),
    lash('M160 76L170 56', 3),
  ],
  mutlaq: [
    ...misbaha,
    shape('rect', { x: 113, y: 180, width: 14, height: 24, rx: 7, ...egg() }, 5.5, 'up'),
    shape('path', { d: 'M110 206h20l12 28h-44z', ...egg(0.8) }, 6, 'up'),
  ],
  ahwal: [
    shape('circle', { cx: 196, cy: 44, r: 32, ...egg() }, 0),
    shape('rect', { x: 88, y: 12, width: 64, height: 64, ...shade(0.2) }, 0.5),
    shape('path', { d: 'M12 76a32 32 0 0 1 64 0z', ...egg() }, 1, 'up'),
    shape('path', { d: 'M164 152l32-64 32 64z', ...shade(0.2) }, 0.5, 'up'),
    shape('path', { d: 'M152 152V88a64 64 0 0 0-64 64z', ...egg() }, 1),
    shape('circle', { cx: 44, cy: 120, r: 32, ...shade(0.2) }, 1.5),
    shape('path', { d: 'M164 228v-32a32 32 0 0 1 64 0v32z', ...egg() }, 1, 'up'),
    shape('path', { d: 'M120 164l32 32-32 32-32-32z', ...shade(0.2) }, 1.5),
    shape(
      'path',
      { d: 'M44 164c18 22 32 36 32 48a32 32 0 0 1-64 0c0-12 14-26 32-48z', ...egg() },
      2,
      'rise'
    ),
  ],
};
