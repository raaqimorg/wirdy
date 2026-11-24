import type { Occasion } from './occasions';
import { PALETTE } from './palette';

export type Enter = 'across' | 'fade' | 'grow' | 'turn' | 'up';

export type Shape = {
  tag: 'circle' | 'path' | 'rect';
  attrs: Record<string, string | number>;
  enter?: Enter;
};

const EGG = PALETTE.eggshell;
const EDGE = 240;
const CENTER = EDGE / 2;

const round = (value: number) => Math.round(value * 10) / 10;
const times = <T>(count: number, make: (index: number) => T): T[] =>
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

const halves: Shape[] = [
  dark('path', { d: 'M0 122A96 96 0 0 0 192 122Z', ...shade(0.24) }),
  lit('path', 'up', { d: 'M48 118A96 96 0 0 1 240 118Z', ...egg() }),
];

const arches: Shape[] = [
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

const THIRDS = [0.14, 0.24, 0.36];

const hundred: Shape[] = times(100, (index) => {
  const place = { cx: 228 - (index % 10) * 24, cy: 12 + Math.floor(index / 10) * 24, r: 10 };
  return index === 99
    ? lit('circle', 'grow', { ...place, ...egg() })
    : dark('circle', { ...place, ...shade(THIRDS[Math.floor(index / 33)]!) });
});

const night: Shape[] = [
  dark('circle', { cx: 120, cy: 120, r: 120, ...shade(0.15) }),
  dark('circle', { cx: 112, cy: 128, r: 100, ...shade(0.15) }),
  lit('path', 'turn', {
    d: 'M92.7 56.8A80 80 0 1 0 183.2 147.3A64 64 0 0 1 92.7 56.8Z',
    ...egg(),
  }),
  lit('circle', 'grow', { cx: 168, cy: 72, r: 11, ...egg() }),
];

const RISE = [0.14, 0.2, 0.28, 0.38, 0.5, 0.68, 1];
const PIVOT = { x: 9, y: 231 };

const bar = (degrees: number): string => {
  const angle = (degrees * Math.PI) / 180;
  const corner = (along: number, off: number) =>
    `${round(PIVOT.x + along * Math.cos(angle) + off * Math.sin(angle))} ${round(
      PIVOT.y - along * Math.sin(angle) + off * Math.cos(angle)
    )}`;
  return `M${corner(72, -9)}L${corner(231, -9)}L${corner(231, 9)}L${corner(72, 9)}Z`;
};

const standing: Shape[] = RISE.map((opacity, index) => {
  const attrs = { d: bar(index * 15), ...egg(opacity) };
  return index === RISE.length - 1 ? lit('path', 'up', attrs) : dark('path', attrs);
});

const unbroken: Shape[] = [
  lit('path', 'fade', {
    d: 'M10 10H230V230H10V58H182V182H58V106H134V134H106',
    ...line(EGG, 20),
  }),
];

const roads: Shape[] = [
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

const NARRATORS = [20, 86.7, 153.3, 220];

const disc = (x: number, y: number): string =>
  `M${round(x - 20)} ${y}A20 20 0 0 1 ${round(x + 20)} ${y}A20 20 0 0 1 ${round(x - 20)} ${y}Z`;

const chain = (y: number): string =>
  [`M20 ${y - 4}H220V${y + 4}H20Z`, ...NARRATORS.map((x) => disc(x, y))].join('');

const chains: Shape[] = [
  ...[30, 90, 210].map((y) => dark('path', { d: chain(y), ...shade(0.22) })),
  lit('rect', 'across', { x: 20, y: 146, width: 46, height: 8, ...egg() }),
  lit('rect', 'across', { x: 153, y: 146, width: 67, height: 8, ...egg() }),
  ...[20, 153.3, 220].map((cx) => lit('circle', 'grow', { cx, cy: 150, r: 20, ...egg() })),
];

export type EmblemName = Occasion | 'unproven';

export const EMBLEMS: Record<EmblemName, Shape[]> = {
  'sabah-masaa': halves,
  masjid: arches,
  salah: hundred,
  nawm: night,
  istiqaz: standing,
  mutlaq: unbroken,
  ahwal: roads,
  unproven: chains,
};
