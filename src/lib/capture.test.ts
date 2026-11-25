import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { captureOfMarkdown, sourceOf, type Capture } from './capture';
import { normalize } from './matching';

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), 'src/lib/fixtures', name), 'utf8');
const json = (name: string): Capture => JSON.parse(fixture(name));

const dorar = json('capture-dorar.json');
const shamela = json('capture-shamela.json');
const sunnah = json('capture-sunnah.json');
const hdith = captureOfMarkdown(fixture('hdith-9775.md'), '2026-11-25');

describe('a dorar.net page', () => {
  const source = sourceOf(dorar);

  it('gives the book, the number, the grader, and the ruling', () => {
    expect(source).toMatchObject({
      site: 'dorar',
      url: dorar.url,
      date: '2026-11-25',
      book: 'صحيح البخاري',
      number: '6306',
      grader: 'البخاري',
      ruling: 'صحيح',
    });
  });

  it('keeps the hadith as it was, without the labels and topics under it', () => {
    expect(dorar.text.startsWith(source.text)).toBe(true);
    expect(normalize(source.text)).toContain('أعوذ بك من شر ما صنعت');
    expect(source.text).not.toContain('أذكار المساء');
    expect(source.text).not.toContain('خلاصة حكم المحدث');
  });

  it('is refused when a label is missing', () => {
    const text = dorar.text.replace('خلاصة حكم المحدث', '');
    expect(() => sourceOf({ ...dorar, text })).toThrow('خلاصة حكم المحدث');
  });
});

describe('a Shamela page', () => {
  it('gives the book, its edition, volume, page, and number', () => {
    expect(sourceOf(shamela)).toMatchObject({
      book: 'صحيح البخاري',
      edition: 'ط السلطانية',
      volume: '8',
      page: '67',
      number: '6306',
      text: shamela.text,
    });
  });

  it('gives another number when one is named, since a page holds many hadiths', () => {
    expect(sourceOf(shamela, '6307').number).toBe('6307');
  });

  it('is refused when no number is found or named', () => {
    const text = 'باب بلا رقم';
    expect(() => sourceOf({ ...shamela, text })).toThrow('number');
  });

  it('may have no volume and no edition', () => {
    const title = 'ص12 - كتاب الكلم الطيب - باب - المكتبة الشاملة';
    expect(sourceOf({ ...shamela, title })).toMatchObject({
      book: 'الكلم الطيب',
      edition: 'بلا طبعة مذكورة',
      volume: 'بلا جزء',
      page: '12',
    });
  });
});

describe('a sunnah.com page', () => {
  it('gives the book and the number of its address', () => {
    expect(sourceOf(sunnah)).toMatchObject({
      book: 'صحيح البخاري',
      number: '6306',
      text: sunnah.text,
    });
  });

  it('is refused when its collection is not a primary one', () => {
    expect(() => sourceOf({ ...sunnah, url: 'https://sunnah.com/hisn:1' })).toThrow('hisn');
  });
});

describe('an hdith.com page', () => {
  it('gives the book, and the usual number, not its own', () => {
    expect(sourceOf(hdith)).toMatchObject({
      site: 'hdith',
      url: 'https://hdith.com/encyclopedia/book/b-1/h/9775',
      book: 'صحيح البخاري',
      number: '6306',
    });
  });

  it('keeps the hadith as it was, without the commentary under it', () => {
    const { text } = sourceOf(hdith);
    expect(fixture('hdith-9775.md')).toContain(text);
    expect(normalize(text)).toContain('سيد الاستغفار أن تقول');
    expect(text).not.toContain('الشروح');
  });
});
