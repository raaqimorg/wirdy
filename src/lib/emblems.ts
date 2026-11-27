import { Array as Arr, Option } from 'effect';
import type { Occasion } from './occasions';
import type { Guide } from './site';
import { PALETTE } from './palette';

export type Enter = 'across' | 'fade' | 'grow' | 'turn' | 'up';

export type Shape = {
  readonly tag: 'circle' | 'path' | 'rect';
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly enter?: Enter;
};

const EGG = PALETTE.eggshell;
const EDGE = 240;
const CENTER = EDGE / 2;

const round = (value: number) => Math.round(value * 10) / 10;
const times = <T>(count: number, make: (index: number) => T): ReadonlyArray<T> =>
  Array.from({ length: count }, (_, index) => make(index));

const egg = (opacity = 1) => ({ fill: EGG, ...(opacity < 1 && { 'fill-opacity': opacity }) });
const shade = (opacity: number) => ({ fill: PALETTE.shade, 'fill-opacity': opacity });
const line = (color: string, width: number, opacity = 1) => ({
  fill: 'none',
  stroke: color,
  'stroke-width': width,
  ...(opacity < 1 && { 'stroke-opacity': opacity }),
});

const dark = (tag: Shape['tag'], attrs: Shape['attrs']): Shape => ({ tag, attrs });
const lit = (tag: Shape['tag'], enter: Enter, attrs: Shape['attrs']): Shape => ({
  tag,
  attrs,
  enter,
});

const halves: ReadonlyArray<Shape> = [
  dark('path', { d: 'M0 122A96 96 0 0 0 192 122Z', ...shade(0.24) }),
  lit('path', 'up', { d: 'M48 118A96 96 0 0 1 240 118Z', ...egg() }),
];

const arches: ReadonlyArray<Shape> = [
  ...times(5, (index) => {
    const radius = CENTER - index * 20;
    const spring = round(CENTER + index * 14.4);
    return dark('path', {
      d: `M${CENTER - radius} 240V${spring}A${radius} ${radius} 0 0 1 ${CENTER + radius} ${spring}V240Z`,
      ...shade(0.15),
    });
  }),
  lit('path', 'up', { d: 'M100 240V194A20 20 0 0 1 140 194V240Z', ...egg() }),
];

const mat: ReadonlyArray<Shape> = [
  dark('rect', { x: 56, y: 12, width: 128, height: 216, rx: 4, ...shade(0.16) }),
  dark('rect', { x: 72, y: 28, width: 96, height: 184, rx: 2, ...line(PALETTE.shade, 6, 0.2) }),
  ...times(4, (index) =>
    dark('rect', { x: 88, y: 132 + index * 18, width: 64, height: 6, rx: 3, ...shade(0.14) })
  ),
  lit('path', 'up', { d: 'M88 116V84A32 32 0 0 1 152 84V116Z', ...egg() }),
];

const THIRDS = [0.14, 0.24, 0.36] as const;
const thirdOf = (index: number): number =>
  Option.getOrElse(Arr.get(THIRDS, Math.floor(index / 33)), () => THIRDS[2]);

const hundred: ReadonlyArray<Shape> = times(100, (index) => {
  const place = { cx: 228 - (index % 10) * 24, cy: 12 + Math.floor(index / 10) * 24, r: 10 };
  return index === 99
    ? lit('circle', 'grow', { ...place, ...egg() })
    : dark('circle', { ...place, ...shade(thirdOf(index)) });
});

const STARS = [
  [200, 30, 4],
  [150, 60, 3],
  [214, 96, 5],
  [100, 28, 3],
  [176, 128, 3],
  [44, 40, 4],
  [128, 104, 2.5],
  [226, 160, 3],
  [64, 84, 2.5],
] as const;

const sky: ReadonlyArray<Shape> = [
  dark('path', { d: 'M0 240V208Q120 176 240 208V240Z', ...shade(0.24) }),
  ...STARS.map(([cx, cy, r]) => dark('circle', { cx, cy, r, ...egg(0.55) })),
  lit('path', 'turn', {
    d: 'M79.9 80.5A60 60 0 1 0 143.9 161.9A52 52 0 0 1 79.9 80.5Z',
    ...egg(),
  }),
];

const SUN = { x: 120, y: 240 };

const ray = (index: number): string => {
  const degrees = 10 + index * 20;
  const angle = (degrees * Math.PI) / 180;
  const fit = Math.min(196, 104 / Math.abs(Math.cos(angle)), 228 / Math.sin(angle));
  const length = index % 2 ? fit * 0.72 : fit;
  const point = (radius: number) =>
    `${round(SUN.x + radius * Math.cos(angle))} ${round(SUN.y - radius * Math.sin(angle))}`;
  return `M${point(60)}L${point(length)}`;
};

const light: ReadonlyArray<Shape> = [
  ...times(9, (index) =>
    dark('path', {
      d: ray(index),
      ...line(PALETTE.shade, 12, 0.24),
      'stroke-linecap': 'round',
    })
  ),
  lit('path', 'up', { d: 'M76 240A44 44 0 0 1 164 240Z', ...egg() }),
];

const unbroken: ReadonlyArray<Shape> = [
  lit('path', 'fade', {
    d: 'M10 10H230V230H10V58H182V182H58V106H134V134H106',
    ...line(EGG, 20),
  }),
];

const HEX = 30;
const COMB_STEP = HEX * Math.sqrt(3);

const CELL = HEX - 4;

const hexagon = (cx: number, cy: number): string =>
  `M${times(6, (index) => {
    const angle = ((60 * index - 90) * Math.PI) / 180;
    return `${round(cx + CELL * Math.cos(angle))} ${round(cy + CELL * Math.sin(angle))}`;
  }).join('L')}Z`;

const COMB = [-2, -1, 0, 1, 2].flatMap((row) => {
  const columns = row % 2 === 0 ? [-1, 0, 1] : [-1.5, -0.5, 0.5, 1.5];
  return columns.map((column) => ({
    lit: row === 0 && column === 0,
    cx: CENTER + column * COMB_STEP,
    cy: CENTER + row * HEX * 1.5,
  }));
});

const comb: ReadonlyArray<Shape> = [
  ...COMB.filter(({ lit: isLit }) => !isLit).map(({ cx, cy }) =>
    dark('path', { d: hexagon(cx, cy), ...shade(0.16) })
  ),
  lit('path', 'grow', { d: hexagon(CENTER, CENTER), ...egg() }),
];

const house: ReadonlyArray<Shape> = [
  dark('path', { d: 'M24 228V104L120 28L216 104V228Z', ...shade(0.16) }),
  dark('rect', { x: 52, y: 124, width: 36, height: 36, rx: 2, ...shade(0.16) }),
  dark('rect', { x: 152, y: 124, width: 36, height: 36, rx: 2, ...shade(0.16) }),
  lit('path', 'up', { d: 'M100 228V180A20 20 0 0 1 140 180V228Z', ...egg() }),
];

const climb: ReadonlyArray<Shape> = [
  dark('path', {
    d: 'M6 216L58 110L100 172L150 54L196 146L234 100',
    ...line(PALETTE.shade, 16, 0.22),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }),
  lit('circle', 'grow', { cx: 150, cy: 46, r: 20, ...egg() }),
];

const DEPTHS = [
  [112, 0.14],
  [80, 0.16],
  [48, 0.2],
] as const;

const darkness: ReadonlyArray<Shape> = [
  ...DEPTHS.map(([r, opacity]) => dark('circle', { cx: CENTER, cy: CENTER, r, ...shade(opacity) })),
  lit('circle', 'grow', { cx: CENTER, cy: CENTER, r: 16, ...egg() }),
];

const TERMS = [180, 120, 204, 84, 150, 104] as const;

const terms: ReadonlyArray<Shape> = TERMS.map((width, index) => {
  const place = { x: 228 - width, y: 14 + index * 37, width, height: 24, rx: 12 };
  return index === 3
    ? lit('rect', 'across', { ...place, ...egg() })
    : dark('rect', { ...place, ...shade(0.22) });
});

const rounds: ReadonlyArray<Shape> = [
  ...times(3, (index) =>
    dark('circle', { cx: CENTER, cy: CENTER, r: 108 - index * 24, ...line(PALETTE.shade, 12, 0.2) })
  ),
  lit('rect', 'turn', { x: 96, y: 96, width: 48, height: 48, rx: 2, ...egg() }),
];

const covered: ReadonlyArray<Shape> = [
  dark('path', { d: 'M28 124A92 92 0 0 0 212 124Z', ...shade(0.22) }),
  dark('rect', { x: 88, y: 214, width: 64, height: 14, rx: 7, ...shade(0.22) }),
  lit('path', 'up', {
    d: 'M26 96H214A10 10 0 0 1 214 116H26A10 10 0 0 1 26 96ZM104 96A16 16 0 0 1 136 96Z',
    ...egg(),
  }),
];

const TURNS = [22, -34, 12, -16, 0, 30, -26, 40, -10] as const;

const turned = (cx: number, cy: number, degrees: number): string =>
  `M${times(4, (index) => {
    const angle = ((degrees + 45 + index * 90) * Math.PI) / 180;
    const reach = 52 / Math.SQRT2;
    return `${round(cx + reach * Math.cos(angle))} ${round(cy + reach * Math.sin(angle))}`;
  }).join('L')}Z`;

const steady: ReadonlyArray<Shape> = [
  ...TURNS.flatMap((degrees, index) =>
    index === 4
      ? []
      : [
          dark('path', {
            d: turned(40 + (index % 3) * 80, 40 + Math.floor(index / 3) * 80, degrees),
            ...shade(0.2),
          }),
        ]
  ),
  lit('rect', 'turn', { x: 92, y: 92, width: 56, height: 56, rx: 3, ...egg() }),
];

const cure: ReadonlyArray<Shape> = [
  dark('path', { d: 'M24 112H80A40 40 0 0 0 160 112H216V228H24Z', ...shade(0.22) }),
  lit('path', 'up', { d: 'M80 56A40 40 0 0 0 160 56Z', ...egg() }),
];

const cloud: ReadonlyArray<Shape> = [
  dark('rect', { x: 0, y: 222, width: 240, height: 6, rx: 3, ...shade(0.24) }),
  dark('path', {
    d: 'M28 104A30 30 0 0 1 72 64A40 40 0 0 1 148 72A28 28 0 0 1 180 104Z',
    ...shade(0.14),
  }),
  dark('path', {
    d: 'M100 160A20 20 0 0 1 130 132A26 26 0 0 1 180 136A20 20 0 0 1 212 160Z',
    ...shade(0.22),
  }),
  lit('path', 'up', {
    d: 'M120 222A23 23 0 0 1 152 190A30 30 0 0 1 210 196A22 22 0 0 1 232 222Z',
    ...egg(),
  }),
];

const stopper: ReadonlyArray<Shape> = [
  dark('path', { d: 'M120 122L168 166L120 222L72 166Z', ...shade(0.22) }),
  dark('path', { d: 'M120 140L150 166L120 200L90 166Z', ...shade(0.14) }),
  dark('rect', { x: 113, y: 98, width: 14, height: 28, ...shade(0.3) }),
  dark('rect', { x: 104, y: 92, width: 32, height: 9, rx: 4, ...shade(0.3) }),
  lit('path', 'up', { d: 'M120 10C129 38 132 64 120 90C108 64 111 38 120 10Z', ...egg() }),
];

export type EmblemName = Occasion | Guide;

export const EMBLEMS: Readonly<Record<EmblemName, ReadonlyArray<Shape>>> = {
  'sabah-masaa': halves,
  masjid: arches,
  'fi-al-salah': mat,
  salah: hundred,
  nawm: sky,
  istiqaz: light,
  mutlaq: unbroken,
  mawasim: rounds,
  taam: covered,
  bayt: house,
  safar: climb,
  nas: steady,
  hamm: darkness,
  marad: cure,
  janaiz: terms,
  matar: cloud,
  jumuah: stopper,
  tibb: comb,
};
