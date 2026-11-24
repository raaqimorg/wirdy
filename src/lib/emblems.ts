import type { Occasion } from './occasions';

export type Shape = {
  tag: 'circle' | 'path' | 'rect';
  attrs: Record<string, string | number>;
  order: number;
};

const EGG = { fill: '#f4f1d0' };
const shade = (opacity: number) => ({ fill: '#000', 'fill-opacity': opacity });

const beads: Shape[] = Array.from({ length: 33 }, (_, index) => {
  const angle = (index / 33) * 2 * Math.PI - Math.PI / 2;
  return {
    tag: 'circle',
    attrs: {
      cx: (120 + 98 * Math.cos(angle)).toFixed(1),
      cy: (120 + 98 * Math.sin(angle)).toFixed(1),
      r: 7.5,
      ...(index < 11 ? EGG : shade(0.22)),
    },
    order: Math.floor(index / 3) / 2,
  };
});

export const EMBLEMS: Record<Occasion, Shape[]> = {
  'sabah-masaa': [
    { tag: 'circle', attrs: { cx: 120, cy: 120, r: 112, ...shade(0.1) }, order: 0 },
    { tag: 'path', attrs: { d: 'M72 114a72 72 0 0 1 144 0z', ...EGG }, order: 1 },
    { tag: 'path', attrs: { d: 'M24 126a72 72 0 0 0 144 0z', ...shade(0.25) }, order: 2 },
    { tag: 'rect', attrs: { x: 8, y: 117, width: 224, height: 6, ...EGG }, order: 3 },
  ],
  salah: [
    { tag: 'path', attrs: { d: 'M40 228V120a80 80 0 0 1 160 0v108z', ...shade(0.1) }, order: 0 },
    { tag: 'path', attrs: { d: 'M62 228V122a58 58 0 0 1 116 0v106z', ...shade(0.16) }, order: 1 },
    { tag: 'path', attrs: { d: 'M86 228V124a34 34 0 0 1 68 0v104z', ...EGG }, order: 2 },
  ],
  nawm: [
    { tag: 'circle', attrs: { cx: 120, cy: 120, r: 112, ...shade(0.1) }, order: 0 },
    { tag: 'path', attrs: { d: 'M120 36a84 84 0 1 0 84 84a66 66 0 0 1-84-84z', ...EGG }, order: 1 },
    { tag: 'circle', attrs: { cx: 172, cy: 62, r: 7, ...EGG }, order: 2 },
    { tag: 'circle', attrs: { cx: 198, cy: 92, r: 4, ...EGG }, order: 3 },
  ],
  istiqaz: [
    {
      tag: 'path',
      attrs: { d: 'M10 170a110 110 0 0 1 220 0z', ...EGG, 'fill-opacity': 0.18 },
      order: 0,
    },
    {
      tag: 'path',
      attrs: { d: 'M40 170a80 80 0 0 1 160 0z', ...EGG, 'fill-opacity': 0.24 },
      order: 1,
    },
    { tag: 'path', attrs: { d: 'M70 170a50 50 0 0 1 100 0z', ...EGG }, order: 2 },
    { tag: 'rect', attrs: { x: 10, y: 176, width: 220, height: 34, ...shade(0.2) }, order: 3 },
  ],
  mutlaq: beads,
  ahwal: [
    { tag: 'circle', attrs: { cx: 64, cy: 64, r: 48, ...EGG }, order: 0 },
    { tag: 'rect', attrs: { x: 128, y: 16, width: 96, height: 96, ...shade(0.2) }, order: 1 },
    { tag: 'path', attrs: { d: 'M16 224l48-96 48 96z', ...shade(0.2) }, order: 2 },
    { tag: 'path', attrs: { d: 'M128 224a48 48 0 0 1 96 0z', ...EGG }, order: 3 },
  ],
};
