import type { Present } from './proof';

export type Capture = {
  site: 'dorar' | 'shamela' | 'hdith' | 'sunnah' | 'tanzil';
  url: string;
  capturedAt: string;
  title: string;
  text: string;
};

const RULING_LABEL = 'خلاصة حكم المحدث';

const COLLECTIONS: Record<string, string> = {
  bukhari: 'صحيح البخاري',
  muslim: 'صحيح مسلم',
  abudawud: 'سنن أبي داود',
  tirmidhi: 'جامع الترمذي',
  nasai: 'سنن النسائي',
  ibnmajah: 'سنن ابن ماجه',
  adab: 'الأدب المفرد',
};

const FIRST = /(\d+) \d+(?: \([^)]*\))? (?:- )?\p{L}/u;
const SECOND = /\d+ (\d+)(?: \([^)]*\))? (?:- )?\p{L}/u;
const USUAL: Record<string, RegExp> = {
  'صحيح مسلم': FIRST,
  'سنن أبي داود': FIRST,
  'سنن النسائي': /(\d+) \d+ \/ \d+ (?:- )?\p{L}/u,
};

function find(text: string, pattern: RegExp, label: string): string {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`no ${label} in the captured page`);
  return value;
}

function base({ site, url, capturedAt }: Capture) {
  return { state: 'present' as const, site, url, date: capturedAt };
}

function fromDorar(capture: Capture): Present {
  const ruling = find(capture.text, /خلاصة حكم المحدث\s*:\s*([\s\S]*?)\s*الراوي\s*:/, RULING_LABEL);
  return {
    ...base(capture),
    book: find(capture.text, /المصدر\s*:\s*([\s\S]*?)\s*الصفحة أو الرقم/, 'المصدر'),
    number: find(capture.text, /الصفحة أو الرقم\s*:\s*(\S+)/, 'الصفحة أو الرقم'),
    grader: find(capture.text, /\|\s*المحدث\s*:\s*([\s\S]*?)\s*\|/, 'المحدث'),
    ruling: ruling.replace(/^\[([\s\S]*)\]$/, '$1').trim(),
    text: capture.text.slice(0, capture.text.indexOf(RULING_LABEL)),
  };
}

function fromShamela(capture: Capture, number?: string): Present {
  const { title, text } = capture;
  const name = find(title, / كتاب (.+?) - /, 'book');
  const parts = name.match(/^(.+?) ((?:ط|ت) .+)$/);
  return {
    ...base(capture),
    book: parts?.[1] ?? name,
    edition: parts?.[2] ?? 'بلا طبعة مذكورة',
    volume: title.match(/^ج(\S+) - /)?.[1] ?? 'بلا جزء',
    page: find(title, /(?:^| )ص(\S+) - /, 'page'),
    number: number ?? latin(find(text, /^\s*([٠-٩]+)\s*-/, 'number')),
    text,
  };
}

function fromSunnah(capture: Capture): Present {
  const [, collection, number] = capture.url.match(/sunnah\.com\/([a-z]+):(\w+)$/) ?? [];
  const book = COLLECTIONS[collection ?? ''];
  if (!book || !number) throw new Error(`no primary collection at ${capture.url}`);
  return { ...base(capture), book, number, text: capture.text };
}

function fromHdith(capture: Capture): Present {
  const book = find(capture.title, /\| ([^|(]+?) \(\d+\)$/, 'book');
  const usual = USUAL[book] ?? SECOND;
  return {
    ...base(capture),
    book,
    number: find(capture.text, usual, 'number'),
    text: capture.text,
  };
}

function fromTanzil(capture: Capture): Present {
  return {
    ...base(capture),
    book: 'القرآن الكريم',
    number: find(capture.title, /^(\d+:\d+(?:-\d+:\d+)?(?:, \d+:\d+(?:-\d+:\d+)?)*)$/, 'ayat'),
    text: capture.text,
  };
}

function latin(text: string): string {
  return text.replaceAll(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function captureOfMarkdown(markdown: string, date: string): Capture {
  return {
    site: 'hdith',
    url: find(markdown, /^canonical: '(.+)'$/m, 'canonical'),
    capturedAt: date,
    title: find(markdown, /^title: '(.+)'$/m, 'title'),
    text: find(markdown, /^## نص الحديث\n\n> (.+)$/m, 'نص الحديث'),
  };
}

export function sourceOf(capture: Capture, number?: string): Present {
  if (capture.site === 'dorar') return fromDorar(capture);
  if (capture.site === 'shamela') return fromShamela(capture, number);
  if (capture.site === 'sunnah') return fromSunnah(capture);
  if (capture.site === 'tanzil') return fromTanzil(capture);
  return fromHdith(capture);
}
