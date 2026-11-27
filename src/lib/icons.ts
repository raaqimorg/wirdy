export type IconName =
  | 'alert'
  | 'back'
  | 'check'
  | 'chevron'
  | 'copy'
  | 'erase'
  | 'open'
  | 'out'
  | 'save'
  | 'search'
  | 'sections'
  | 'share';

type Icon = {
  readonly paths: ReadonlyArray<string>;
};

export const ICON_GRID = 24;

export const ICONS: Readonly<Record<IconName, Icon>> = {
  alert: { paths: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 7.5v5', 'M12 16.25v.01'] },
  back: { paths: ['M9 5L16 12l-7 7'] },
  chevron: { paths: ['M5 9L12 16l7-7'] },
  check: { paths: ['M4 13l5 5L20 6'] },
  erase: {
    paths: ['M14 4l6 6-9 9-6-6z', 'M8.5 9.5l6 6', 'M13 20h7'],
  },
  search: {
    paths: ['M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z', 'M20 20l-4-4'],
  },
  sections: {
    paths: [
      'M5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3A1.5 1.5 0 0 1 5.5 4z',
      'M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3A1.5 1.5 0 0 1 15.5 4z',
      'M5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3A1.5 1.5 0 0 1 5.5 14z',
      'M15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5z',
    ],
  },
  out: { paths: ['M19 19l-14-14M5 16V5H16'] },
  copy: { paths: ['M9 9h12v12h-12z', 'M15 4V3h-12v12H4'] },
  open: { paths: ['M15 5L8 12l7 7'] },
  share: { paths: ['M12 15v-12M7 7L12 2l5 5M4 13V22h16V13'] },
  save: { paths: ['M12 2v12M7 10L12 15 17 10M4 16v6h16V16'] },
};
