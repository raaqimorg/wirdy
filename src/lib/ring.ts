export type RingPoint = { readonly cx: string; readonly cy: string };

export function ringPoints(
  count: number,
  center: number,
  radius: number
): ReadonlyArray<RingPoint> {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
    return {
      cx: (center + radius * Math.cos(angle)).toFixed(2),
      cy: (center + radius * Math.sin(angle)).toFixed(2),
    };
  });
}
