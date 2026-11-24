export type DotGrid = { cols: number; rows: number; fine: boolean };

const ROW = 20;

export function dotGrid(count: number): DotGrid {
  if (count <= 10) return { cols: count, rows: 1, fine: false };
  if (count % ROW === 0) return { cols: ROW, rows: count / ROW, fine: true };
  throw new Error(`No dot grid for a count of ${count}. Add one in src/lib/dots.ts.`);
}
