export type IconName =
  | 'back'
  | 'check'
  | 'chevron'
  | 'close'
  | 'copy'
  | 'open'
  | 'out'
  | 'save'
  | 'search'
  | 'share';

type Icon = { size: number; stroke?: number; paths: string[] };

export const ICONS: Record<IconName, Icon> = {
  back: { size: 12, stroke: 1.6, paths: ['M4.5 2.5L8 6l-3.5 3.5'] },
  chevron: { size: 12, stroke: 1.6, paths: ['M2.5 4.5L6 8l3.5-3.5'] },
  check: { size: 12, stroke: 1.6, paths: ['M2 6.5l2.5 2.5L10 3'] },
  close: { size: 12, stroke: 1.6, paths: ['M3 3l6 6M9 3L3 9'] },
  search: {
    size: 24,
    stroke: 2.2,
    paths: ['M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z', 'M20 20l-4-4'],
  },
  out: { size: 12, stroke: 1.6, paths: ['M9.5 9.5l-7-7M2.5 8V2.5H8'] },
  copy: { size: 12, stroke: 1.6, paths: ['M4.5 4.5h6v6h-6z', 'M7.5 2V1.5h-6v6H2'] },
  open: { size: 12, stroke: 1.6, paths: ['M7.5 2.5L4 6l3.5 3.5'] },
  share: { size: 12, stroke: 1.6, paths: ['M6 7.5v-6M3.5 3.5L6 1l2.5 2.5M2 6.5V11h8V6.5'] },
  save: { size: 12, stroke: 1.6, paths: ['M6 1v6M3.5 5L6 7.5 8.5 5M2 8v3h8V8'] },
};
