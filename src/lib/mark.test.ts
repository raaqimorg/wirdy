import { describe, expect, it } from 'vitest';
import { PETALS, markSvg } from './mark';
import { OCCASIONS } from './occasions';
import { PALETTE } from './palette';

describe('the sunflower mark', () => {
  it('has twelve petals around the disc', () => {
    expect(PETALS).toHaveLength(12);
  });

  it('starts with the petal at the top', () => {
    expect(PETALS[0]).toEqual({ cx: '32.00', cy: '10.50' });
  });

  it('paints its disc in the color of the first occasion', () => {
    expect(PALETTE.disc).toBe(OCCASIONS[0]!.color);
  });

  it('writes a standalone SVG with every petal and the disc', () => {
    const svg = markSvg();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/u);
    expect(svg.match(/<circle /gu)).toHaveLength(13);
  });
});
