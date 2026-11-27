import { describe, expect, test } from 'bun:test';
import {
  clipProblems,
  frameCount,
  isSafe,
  lengthProblems,
  sampleProblems,
  textProblems,
  timeLabel,
  timesOf,
} from './rules.ts';

describe('frameCount', () => {
  test('rounds a duration to whole frames', () => {
    expect(frameCount(24.5)).toBe(735);
    expect(frameCount(20)).toBe(600);
  });
});

describe('timesOf', () => {
  test('samples from zero up to the end', () => {
    expect(timesOf(2, 0.5)).toEqual([0, 0.5, 1, 1.5]);
  });
});

describe('timeLabel', () => {
  test('writes a time in seconds', () => {
    expect(timeLabel(6.5)).toBe('6.5s');
    expect(timeLabel(0)).toBe('0s');
  });
});

describe('isSafe', () => {
  test('keeps a box inside the zone', () => {
    expect(isSafe({ x: 120, y: 288, width: 768, height: 400 })).toBe(true);
  });
  test('refuses a box under the right rail low on the frame', () => {
    expect(isSafe({ x: 200, y: 900, width: 650, height: 100 })).toBe(false);
  });
  test('refuses a box above the zone', () => {
    expect(isSafe({ x: 200, y: 200, width: 300, height: 100 })).toBe(false);
  });
});

describe('textProblems', () => {
  const line = { x: 200, y: 400, width: 500, height: 100, size: 80, quote: false };
  test('passes a short line in the zone', () => {
    expect(textProblems(1, { ...line, text: 'أذكارك في وقتها' })).toEqual([]);
  });
  test('names small text', () => {
    expect(textProblems(1, { ...line, size: 24, text: 'وِردي' })).toEqual([
      '1s: «وِردي» is 24 px, under 28',
    ]);
  });
  test('names a line over five words, but not a quote', () => {
    const text = 'سبحان الله وبحمده سبحان الله العظيم';
    expect(textProblems(1, { ...line, text })).toEqual([`1s: «${text}» has 6 words, over 5`]);
    expect(textProblems(1, { ...line, text, quote: true })).toEqual([]);
  });
  test('names the name without its kasra', () => {
    expect(textProblems(2, { ...line, text: 'وردي' })).toEqual([
      '2s: «وردي» needs the kasra: وِردي',
    ]);
  });
  test('names an em-dash', () => {
    const dash = String.fromCodePoint(0x2014);
    expect(textProblems(0, { ...line, text: `صباح ${dash} مساء` })).toEqual([
      `0s: «صباح ${dash} مساء» has an em-dash`,
    ]);
  });
  test('names text outside the zone', () => {
    expect(textProblems(3, { ...line, y: 100, text: 'وِردي' })).toEqual([
      '3s: «وِردي» is outside the safe zone',
    ]);
  });
});

describe('clipProblems', () => {
  test('names a clip that has run out', () => {
    expect(clipProblems(9, { name: 'search.mp4', start: 4, duration: 3 })).toEqual([
      '9s: search.mp4 ended at 7s',
    ]);
  });
  test('passes a clip still playing', () => {
    expect(clipProblems(6, { name: 'search.mp4', start: 4, duration: 3 })).toEqual([]);
  });
});

describe('sampleProblems', () => {
  test('names an empty first frame', () => {
    expect(sampleProblems({ time: 0, texts: [], clips: [] })).toEqual([
      '0s: frame 0 shows nothing: open on the hook',
    ]);
  });
  test('passes a later frame with nothing on it', () => {
    expect(sampleProblems({ time: 4, texts: [], clips: [] })).toEqual([]);
  });
});

describe('lengthProblems', () => {
  test('names a film outside 15 to 30 seconds', () => {
    expect(lengthProblems(12)).toEqual(['the film is 12s, outside 15s to 30s']);
    expect(lengthProblems(24)).toEqual([]);
  });
});
