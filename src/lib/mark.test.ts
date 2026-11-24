import { describe, expect, it } from 'vitest';
import { PETALS, markSvg } from './mark';

describe('the sunflower mark', () => {
  it('has twelve petals around the disc', () => {
    expect(PETALS).toHaveLength(12);
  });

  it('starts with the petal at the top', () => {
    expect(PETALS[0]).toEqual({ cx: '32.00', cy: '10.50' });
  });

  it('writes a standalone SVG with every petal and the disc', () => {
    const svg = markSvg();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
    expect(svg.match(/<circle /g)).toHaveLength(13);
  });
});
