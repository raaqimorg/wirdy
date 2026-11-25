export type IconName =
  | 'back'
  | 'check'
  | 'chevron'
  | 'close'
  | 'copy'
  | 'github'
  | 'moon'
  | 'open'
  | 'out'
  | 'save'
  | 'search'
  | 'share'
  | 'sun';

type Icon = { size: number; stroke?: number; paths: string[]; disc?: number };

export const ICONS: Record<IconName, Icon> = {
  back: { size: 12, stroke: 1.6, paths: ['M1.5 6h9M7 2.5L10.5 6 7 9.5'] },
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
  moon: { size: 24, stroke: 2, paths: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'] },
  sun: {
    size: 24,
    stroke: 2,
    disc: 4.5,
    paths: [
      'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    ],
  },
  github: {
    size: 16,
    paths: [
      'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z',
    ],
  },
};
