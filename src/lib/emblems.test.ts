import { describe, expect, it } from 'vitest';
import { EMBLEMS } from './emblems';
import type { EmblemName, Shape } from './emblems';
import { PALETTE } from './palette';

const STAGE = 240;
const NAMES = Object.keys(EMBLEMS) as EmblemName[];

function pathPoints(d: string): { x: number; y: number }[] {
  const commands = d.match(/[A-Z][^A-Z]*/gu) ?? [];
  let x = 0;
  let y = 0;
  return commands.flatMap((command) => {
    const numbers = (command.slice(1).match(/-?[\d.]+/gu) ?? []).map(Number);
    if (command.startsWith('Z')) return [];
    if (command.startsWith('H')) x = numbers[0]!;
    else if (command.startsWith('V')) y = numbers[0]!;
    else [x, y] = numbers.slice(-2) as [number, number];
    return [{ x, y }];
  });
}

function corners({ tag, attrs }: Shape): number[] {
  const at = (key: string) => Number(attrs[key]);
  if (tag === 'circle') {
    return [at('cx') - at('r'), at('cx') + at('r'), at('cy') - at('r'), at('cy') + at('r')];
  }
  if (tag === 'rect') return [at('x'), at('x') + at('width'), at('y'), at('y') + at('height')];
  return pathPoints(String(attrs['d'])).flatMap(({ x, y }) => [x, y]);
}

const lit = (name: EmblemName) => EMBLEMS[name].filter(({ enter }) => enter);

describe('EMBLEMS', () => {
  it.each(NAMES)('keeps every shape of %s inside the 240 unit stage, paths too', (name) => {
    const values = EMBLEMS[name].flatMap(corners);
    expect(values.length).toBeGreaterThan(0);
    expect(values.filter((value) => !(value >= 0 && value <= STAGE))).toEqual([]);
  });

  it.each(NAMES)('writes the paths of %s in absolute commands', (name) => {
    for (const { attrs } of EMBLEMS[name]) expect(String(attrs['d'] ?? '')).not.toMatch(/[a-z]/u);
  });

  it.each(NAMES)('draws %s in eggshell and black only', (name) => {
    for (const { attrs } of EMBLEMS[name]) {
      const inks = [attrs['fill'], attrs['stroke']].filter(
        (ink) => typeof ink === 'string' && ink !== 'none'
      );
      expect(inks.filter((ink) => ink !== PALETTE.eggshell && ink !== PALETTE.shade)).toEqual([]);
    }
  });

  it.each(NAMES)('lights at least one shape of %s in full eggshell', (name) => {
    expect(lit(name).length).toBeGreaterThan(0);
    for (const { attrs } of lit(name)) {
      expect([attrs['fill'], attrs['stroke']]).toContain(PALETTE.eggshell);
      expect(attrs).not.toHaveProperty('fill-opacity');
      expect(attrs).not.toHaveProperty('stroke-opacity');
    }
  });
});

describe('the emblem of the adhkar after the prayers', () => {
  it('draws 33, 33, and 33 dots in three shades, and lights only the hundredth', () => {
    const shades = EMBLEMS.salah.map(({ attrs }) => attrs['fill-opacity']);
    expect(shades).toHaveLength(100);
    expect(new Set(shades.slice(0, 33)).size).toBe(1);
    expect(new Set(shades.slice(33, 66)).size).toBe(1);
    expect(new Set(shades.slice(66, 99)).size).toBe(1);
    expect(new Set(shades.slice(0, 99)).size).toBe(3);
    expect(lit('salah')).toEqual([EMBLEMS.salah.at(-1)]);
  });
});

describe('the emblem of the adhkar inside the prayer', () => {
  it('steps down from the standing to the prostration, and lights only the lowest', () => {
    const heights = EMBLEMS['fi-al-salah'].map(({ attrs }) => Number(attrs['height']));
    expect(heights).toEqual(heights.toSorted((a, b) => b - a));
    expect(lit('fi-al-salah')).toEqual([EMBLEMS['fi-al-salah'].at(-1)]);
  });
});

describe('the emblem of «ما لم يثبت»', () => {
  it('misses one narrator from the lit chain', () => {
    expect(lit('unproven').filter(({ tag }) => tag === 'circle')).toHaveLength(3);
  });
});
