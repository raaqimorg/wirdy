import { toArabicDigits } from './arabic';

export type BeadRing = { beads: { cx: string; cy: string }[]; label: string | null };

const MAX_BEADS = 10;
const CENTER = 16;
const RADIUS = 12;

export function beadRing(count: number): BeadRing {
  if (count > MAX_BEADS) return { beads: [], label: toArabicDigits(count) };
  const beads = Array.from({ length: count }, (_, index) => {
    const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
    return {
      cx: (CENTER + RADIUS * Math.cos(angle)).toFixed(2),
      cy: (CENTER + RADIUS * Math.sin(angle)).toFixed(2),
    };
  });
  return { beads, label: null };
}
