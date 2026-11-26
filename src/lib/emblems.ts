import { Array as Arr, Option } from 'effect';
import type { Occasion } from './occasions';
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

const way: ReadonlyArray<Shape> = [
  dark('path', {
    d: 'M16 224C96 224 40 120 120 120S144 32 208 32',
    ...line(PALETTE.shade, 20, 0.2),
    'stroke-linecap': 'round',
  }),
  ...times(3, (index) =>
    dark('circle', { cx: 56 + index * 52, cy: 196 - index * 64, r: 6, ...shade(0.24) })
  ),
  lit('circle', 'grow', { cx: 208, cy: 32, r: 18, ...egg() }),
];

const relief: ReadonlyArray<Shape> = [
  dark('rect', { x: 20, y: 20, width: 92, height: 200, rx: 4, ...shade(0.2) }),
  dark('rect', { x: 128, y: 20, width: 92, height: 200, rx: 4, ...shade(0.2) }),
  lit('path', 'grow', { d: 'M112 20H128L123 220H117Z', ...egg() }),
];

const earth: ReadonlyArray<Shape> = [
  ...times(4, (index) =>
    dark('rect', {
      x: 0,
      y: 96 + index * 36,
      width: 240,
      height: 36,
      ...shade(0.08 + index * 0.06),
    })
  ),
  lit('rect', 'fade', { x: 64, y: 176, width: 112, height: 16, rx: 8, ...egg() }),
];

const rounds: ReadonlyArray<Shape> = [
  ...times(3, (index) =>
    dark('circle', { cx: CENTER, cy: CENTER, r: 108 - index * 24, ...line(PALETTE.shade, 12, 0.2) })
  ),
  lit('rect', 'turn', { x: 96, y: 96, width: 48, height: 48, rx: 2, ...egg() }),
];

const bowl: ReadonlyArray<Shape> = [
  dark('path', { d: 'M24 120A96 96 0 0 0 216 120Z', ...shade(0.2) }),
  dark('rect', { x: 84, y: 214, width: 72, height: 14, rx: 7, ...shade(0.2) }),
  ...times(2, (index) => dark('circle', { cx: 84 + index * 72, cy: 96, r: 16, ...shade(0.16) })),
  lit('circle', 'grow', { cx: CENTER, cy: 84, r: 24, ...egg() }),
];

const MEET = Math.round(Math.sqrt(72 ** 2 - 36 ** 2) * 10) / 10;

const meeting: ReadonlyArray<Shape> = [
  dark('circle', { cx: 84, cy: CENTER, r: 72, ...shade(0.16) }),
  dark('circle', { cx: 156, cy: CENTER, r: 72, ...shade(0.16) }),
  lit('path', 'fade', {
    d: `M${CENTER} ${round(CENTER - MEET)}A72 72 0 0 1 ${CENTER} ${round(CENTER + MEET)}A72 72 0 0 1 ${CENTER} ${round(CENTER - MEET)}Z`,
    ...egg(),
  }),
];

const pulse: ReadonlyArray<Shape> = [
  ...times(5, (index) =>
    dark('path', { d: `M0 ${40 + index * 40}H240`, ...line(PALETTE.shade, 4, 0.16) })
  ),
  lit('path', 'fade', {
    d: 'M12 132H80L100 76L132 188L152 112L164 132H228',
    ...line(EGG, 14),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }),
];

const DROPS = [
  [24, 20],
  [70, 20],
  [116, 20],
  [162, 20],
  [208, 20],
  [40, 76],
  [86, 76],
  [132, 76],
  [178, 76],
  [224, 76],
  [24, 132],
  [70, 132],
  [208, 132],
  [40, 188],
  [86, 188],
  [178, 188],
  [224, 188],
] as const;

const rain: ReadonlyArray<Shape> = [
  ...DROPS.map(([x, y]) =>
    dark('path', {
      d: `M${x} ${y}L${x - 12} ${y + 30}`,
      ...line(PALETTE.shade, 7, 0.26),
      'stroke-linecap': 'round',
    })
  ),
  lit('path', 'up', {
    d: 'M124 92C124 92 98 132 98 148A26 26 0 0 0 150 148C150 132 124 92 124 92Z',
    ...egg(),
  }),
];

export type EmblemName = Occasion | 'tibb';

export const EMBLEMS: Readonly<Record<EmblemName, ReadonlyArray<Shape>>> = {
  'sabah-masaa': halves,
  masjid: arches,
  'fi-al-salah': mat,
  salah: hundred,
  nawm: sky,
  istiqaz: light,
  mutlaq: unbroken,
  mawasim: rounds,
  taam: bowl,
  bayt: house,
  safar: way,
  nas: meeting,
  hamm: relief,
  marad: pulse,
  janaiz: earth,
  matar: rain,
  tibb: comb,
};
