import { describe, expect, test } from 'bun:test';
import { differenceOf, flagChangesOf } from './compare.ts';

const imageOf = (pixels: ReadonlyArray<number>) => ({
  width: pixels.length / 4,
  height: 1,
  pixels: Uint8Array.from(pixels),
});

describe('differenceOf', () => {
  test('finds no change between two equal images', () => {
    const image = imageOf([1, 2, 3, 255, 4, 5, 6, 255]);
    expect(differenceOf(image, image).pixels).toBe(0);
  });

  test('ignores a channel that moves within the tolerance', () => {
    expect(differenceOf(imageOf([100, 0, 0, 255]), imageOf([106, 0, 0, 255])).pixels).toBe(0);
  });

  test('marks each pixel that changed once', () => {
    const { pixels, mask } = differenceOf(
      imageOf([0, 0, 0, 255, 0, 0, 0, 255]),
      imageOf([0, 0, 0, 255, 90, 90, 90, 255])
    );
    expect(pixels).toBe(1);
    expect([...mask]).toEqual([0, 1]);
  });
});

describe('flagChangesOf', () => {
  test('lists the flags a change added and the ones it removed', () => {
    const kept = { selector: '.bar', property: 'padding-top', value: '1px' };
    const fixed = { selector: '.entry', property: 'color', value: 'red' };
    const added = { selector: '.row', property: 'margin-top', value: '3px' };
    expect(flagChangesOf([kept, fixed], [kept, added])).toEqual({
      added: [added],
      removed: [fixed],
    });
  });
});
