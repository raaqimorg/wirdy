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

const roads: ReadonlyArray<Shape> = [
  ...times(16, (index) => {
    const x = (index % 4) * 60;
    const y = Math.floor(index / 4) * 60;
    return dark('path', {
      d: `M${x} ${y + 30}A30 30 0 0 0 ${x + 30} ${y}M${x + 30} ${y + 60}A30 30 0 0 1 ${x + 60} ${y + 30}`,
      ...line(PALETTE.shade, 16, 0.2),
    });
  }),
  lit('path', 'fade', {
    d: 'M240 30A30 30 0 0 0 210 60A30 30 0 0 1 180 90A30 30 0 0 0 150 120A30 30 0 0 1 120 150A30 30 0 0 0 90 180A30 30 0 0 1 60 210A30 30 0 0 0 30 240',
    ...line(EGG, 16),
  }),
];

const NARRATORS = [20, 86.7, 153.3, 220] as const;

const disc = (x: number, y: number): string =>
  `M${round(x - 20)} ${y}A20 20 0 0 1 ${round(x + 20)} ${y}A20 20 0 0 1 ${round(x - 20)} ${y}Z`;

const chain = (y: number): string =>
  [`M20 ${y - 4}H220V${y + 4}H20Z`, ...NARRATORS.map((x) => disc(x, y))].join('');

const chains: ReadonlyArray<Shape> = [
  ...[30, 90, 210].map((y) => dark('path', { d: chain(y), ...shade(0.22) })),
  lit('rect', 'across', { x: 20, y: 146, width: 46, height: 8, ...egg() }),
  lit('rect', 'across', { x: 153, y: 146, width: 67, height: 8, ...egg() }),
  ...[20, 153.3, 220].map((cx) => lit('circle', 'grow', { cx, cy: 150, r: 20, ...egg() })),
];

export type EmblemName = Occasion | 'unproven';

export const EMBLEMS: Readonly<Record<EmblemName, ReadonlyArray<Shape>>> = {
  'sabah-masaa': halves,
  masjid: arches,
  'fi-al-salah': mat,
  salah: hundred,
  nawm: sky,
  istiqaz: light,
  mutlaq: unbroken,
  ahwal: roads,
  unproven: chains,
};
