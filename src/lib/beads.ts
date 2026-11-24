import { toArabicDigits } from './arabic';
import { ringPoints, type RingPoint } from './ring';

export type BeadRing = { beads: RingPoint[]; label: string };

const MAX_BEADS = 10;
const CENTER = 16;
const RADIUS = 13;

export function beadRing(count: number): BeadRing {
  const label = toArabicDigits(count);
  if (count > MAX_BEADS) return { beads: [], label };
  return { beads: ringPoints(count, CENTER, RADIUS), label };
}
