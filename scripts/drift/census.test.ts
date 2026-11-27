import { describe, expect, test } from 'bun:test';
import { familyOf, findingsOf, flagsOf, type Family, type Reading, type Sample } from './census.ts';

const INK = [10, 20, 30, 1] as const;
const TONE = [140, 90, 60, 1] as const;

const readingOf = (samples: ReadonlyArray<Partial<Sample>>): Reading => ({
  lengths: {
    '--space-2': 8,
    '--space-4': 16,
    '--text-body': 17,
    '--radius-large': 12,
    '--border-hairline': 1,
    '--ring-inset': -2,
    '--size-touch': 44,
  },
  leadings: { '--leading-snug': 1.5, '--leading-reading': 2.05 },
  contexts: [
    { '--color-ink': { value: 'rgb(10, 20, 30)', color: INK } },
    {
      '--color-ink': { value: 'rgb(10, 20, 30)', color: INK },
      '--tone-fill': { value: 'oklab(0.5 0.1 0.1)', color: TONE },
    },
  ],
  samples: samples.map((sample) => ({
    selector: '.entry',
    context: 0,
    property: 'margin-top',
    value: '',
    number: null,
    color: null,
    current: null,
    ...sample,
  })),
  elements: samples.length,
});

describe('familyOf', () => {
  test.each<[string, Family]>([
    ['font-size', 'text'],
    ['line-height', 'leading'],
    ['padding-left', 'space'],
    ['row-gap', 'space'],
    ['border-top-left-radius', 'radius'],
    ['border-bottom-width', 'border'],
    ['outline-offset', 'offset'],
    ['background-color', 'color'],
    ['fill', 'color'],
  ])('puts %s in %s', (property, family) => {
    expect(familyOf(property)).toBe(family);
  });
});

describe('flagsOf', () => {
  test('passes a spacing that equals a space token', () => {
    expect(flagsOf(readingOf([{ property: 'padding-top', value: '16px', number: 16 }]))).toEqual(
      []
    );
  });

  test('passes a negative space token', () => {
    expect(flagsOf(readingOf([{ property: 'margin-right', value: '-8px', number: -8 }]))).toEqual(
      []
    );
  });

  test('flags a spacing that only a size token has, and names the nearest space', () => {
    const [flag] = flagsOf(readingOf([{ property: 'padding-top', value: '44px', number: 44 }]));
    expect(flag?.nearest).toBe('--space-4 (16)');
  });

  test('flags a user agent padding of one pixel', () => {
    expect(flagsOf(readingOf([{ property: 'padding-top', value: '1px', number: 1 }]))).toHaveLength(
      1
    );
  });

  test('flags a length it could not resolve to pixels', () => {
    expect(flagsOf(readingOf([{ property: 'margin-top', value: 'calc(50% - 4px)' }]))).toHaveLength(
      1
    );
  });

  test('passes a font size on the scale and refuses one off it', () => {
    const flags = flagsOf(
      readingOf([
        { property: 'font-size', value: '17px', number: 17 },
        { property: 'font-size', value: '16px', number: 16 },
      ])
    );
    expect(flags.map(({ value }) => value)).toEqual(['16px']);
  });

  test('reads a line height as a share of the font size', () => {
    const flags = flagsOf(
      readingOf([
        { property: 'line-height', value: '25.5px', number: 1.5 },
        { property: 'line-height', value: 'normal' },
      ])
    );
    expect(flags.map(({ value }) => value)).toEqual(['normal']);
  });

  test('passes a ring drawn inside', () => {
    expect(flagsOf(readingOf([{ property: 'outline-offset', value: '-2px', number: -2 }]))).toEqual(
      []
    );
  });

  test('passes a tone color only inside its tone', () => {
    const sample = { property: 'background-color', value: 'rgb(140, 90, 60)', color: TONE };
    expect(flagsOf(readingOf([{ ...sample, context: 1 }]))).toEqual([]);
    expect(flagsOf(readingOf([{ ...sample, context: 0 }]))).toHaveLength(1);
  });

  test('passes a border in the current color', () => {
    const red = [200, 0, 0, 1] as const;
    expect(
      flagsOf(readingOf([{ property: 'border-top-color', value: 'red', color: red, current: red }]))
    ).toEqual([]);
  });

  test('names the nearest color token of a stray color', () => {
    const [flag] = flagsOf(
      readingOf([{ property: 'color', value: 'rgb(12, 22, 40)', color: [12, 22, 40, 1] }])
    );
    expect(flag?.nearest).toBe('--color-ink');
  });
});

describe('findingsOf', () => {
  test('groups one value seen in two places, most seen first', () => {
    const flag = {
      selector: '.entry',
      property: 'padding-top',
      family: 'space' as const,
      value: '1px',
      nearest: null,
    };
    const other = { ...flag, value: '3px' };
    const place = { engine: 'webkit', viewport: '390', mode: 'light', state: 'home', page: '/' };
    const findings = findingsOf([
      { place, flags: [other, flag] },
      { place: { ...place, mode: 'dark' }, flags: [flag] },
    ]);
    expect(findings.map(({ value, places }) => [value, places.length])).toEqual([
      ['1px', 2],
      ['3px', 1],
    ]);
  });
});
