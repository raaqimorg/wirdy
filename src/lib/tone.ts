import { Array } from 'effect';

export const LIGHTNESS = 0.52;
export const CHROMA = 0.086;
export const NIGHT = 0.9;
export const ARC = { from: 135, span: 300 } as const;
export const FIRST_HUE = 47;
export const INVERSE_GOLDEN = (3 - Math.sqrt(5)) / 2;

const NEUTRAL_CHROMA = 0.025;
const NEUTRAL_HUE = 250;

type Triple = readonly [number, number, number];

const toLinear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const toGamma = (channel: number) =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
const fraction = (value: number) => value - Math.floor(value);

export function linearFromOklch(lightness: number, chroma: number, hue: number): Triple {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexFromOklch(lightness: number, chroma: number, hue: number): string {
  const channels = linearFromOklch(lightness, chroma, hue).map((channel) =>
    Math.round(toGamma(Math.min(1, Math.max(0, channel))) * 255)
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

const channelAt = (hex: string, start: number) =>
  toLinear(Number.parseInt(hex.slice(start, start + 2), 16) / 255);

export function hueOf(hex: string): number {
  const [red, green, blue] = [channelAt(hex, 1), channelAt(hex, 3), channelAt(hex, 5)];
  const l = Math.cbrt(0.4122214708 * red + 0.5363769773 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return fraction(Math.atan2(b, a) / (2 * Math.PI)) * 360;
}

const START = fraction((FIRST_HUE - ARC.from) / 360) * (360 / ARC.span);

const commonDivisor = (one: number, other: number): number =>
  other === 0 ? one : commonDivisor(other, one % other);

export function strideFor(count: number): number {
  const ideal = count * INVERSE_GOLDEN;
  const strides = Array.filter(
    Array.range(1, Math.max(1, count - 1)),
    (stride) => stride < count && commonDivisor(count, stride) === 1
  );
  return Array.reduce(strides, 1, (best, stride) =>
    Math.abs(stride - ideal) < Math.abs(best - ideal) ? stride : best
  );
}

export function hueAt(index: number, count: number): number {
  const place = START + ((index * strideFor(count)) % count) / count;
  return (ARC.from + ARC.span * fraction(place)) % 360;
}

function luminance(hex: string): number {
  const [red, green, blue] = [channelAt(hex, 1), channelAt(hex, 3), channelAt(hex, 5)];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrast(one: string, other: string): number {
  const [first, second] = [luminance(one), luminance(other)];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export const toneOf = (index: number, count: number) =>
  hexFromOklch(LIGHTNESS, CHROMA, hueAt(index, count));

export const NEUTRAL = hexFromOklch(LIGHTNESS, NEUTRAL_CHROMA, NEUTRAL_HUE);
