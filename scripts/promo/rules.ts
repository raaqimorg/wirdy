export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const SAFE = {
  left: 120,
  right: 888,
  narrowRight: 780,
  narrowFrom: 840,
  top: 288,
  bottom: 1248,
} as const;
export const MIN_TEXT = 28;
export const MAX_WORDS = 5;
export const LENGTH = { min: 15, max: 30 } as const;

const NAME = 'وِردي';
const BARE_NAME = /(?<![\p{L}\p{M}])وردي(?![\p{L}\p{M}])/u;
const EM_DASH = String.fromCodePoint(0x2014);

export type Box = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type TextBox = Box & {
  readonly text: string;
  readonly size: number;
  readonly quote: boolean;
};

export type ClipState = {
  readonly name: string;
  readonly start: number;
  readonly duration: number;
};

export type Sample = {
  readonly time: number;
  readonly texts: ReadonlyArray<TextBox>;
  readonly clips: ReadonlyArray<ClipState>;
};

export const frameCount = (duration: number, fps: number = FPS): number =>
  Math.round(duration * fps);

export const timesOf = (duration: number, step: number): ReadonlyArray<number> =>
  Array.from({ length: Math.ceil(duration / step) }, (_, index) => index * step);

export const timeLabel = (time: number): string => `${String(Math.round(time * 100) / 100)}s`;

export const isSafe = ({ x, y, width, height }: Box): boolean => {
  const bottom = y + height;
  const right = bottom > SAFE.narrowFrom ? SAFE.narrowRight : SAFE.right;
  return x >= SAFE.left && x + width <= right && y >= SAFE.top && bottom <= SAFE.bottom;
};

const wordsOf = (text: string): number => text.trim().split(/\s+/u).length;

export const textProblems = (time: number, box: TextBox): ReadonlyArray<string> => {
  const at = `${timeLabel(time)}: «${box.text}»`;
  const words = wordsOf(box.text);
  return [
    ...(box.size < MIN_TEXT ? [`${at} is ${String(box.size)} px, under ${String(MIN_TEXT)}`] : []),
    ...(!box.quote && words > MAX_WORDS
      ? [`${at} has ${String(words)} words, over ${String(MAX_WORDS)}`]
      : []),
    ...(BARE_NAME.test(box.text) ? [`${at} needs the kasra: ${NAME}`] : []),
    ...(box.text.includes(EM_DASH) ? [`${at} has an em-dash`] : []),
    ...(isSafe(box) ? [] : [`${at} is outside the safe zone`]),
  ];
};

export const clipProblems = (time: number, clip: ClipState): ReadonlyArray<string> =>
  time > clip.start + clip.duration + 1 / FPS
    ? [`${timeLabel(time)}: ${clip.name} ended at ${timeLabel(clip.start + clip.duration)}`]
    : [];

export const sampleProblems = ({ time, texts, clips }: Sample): ReadonlyArray<string> => [
  ...(time === 0 && texts.length === 0 && clips.length === 0
    ? [`${timeLabel(time)}: frame 0 shows nothing: open on the hook`]
    : []),
  ...texts.flatMap((box) => textProblems(time, box)),
  ...clips.flatMap((clip) => clipProblems(time, clip)),
];

export const lengthProblems = (duration: number): ReadonlyArray<string> =>
  duration < LENGTH.min || duration > LENGTH.max
    ? [
        `the film is ${timeLabel(duration)}, outside ${timeLabel(LENGTH.min)} to ${timeLabel(LENGTH.max)}`,
      ]
    : [];
