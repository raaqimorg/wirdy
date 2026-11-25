import { Effect } from 'effect';
import { describe, it, expect } from 'vitest';
import { formOf as formEffect, parseVariants as variantsEffect, type Form } from './variants';

const parseVariants = (input: string) => Effect.runSync(variantsEffect(input));
const formOf = (input: string, form: Form) => Effect.runSync(formEffect(input, form));

describe('formOf', () => {
  it('reads a text in one form, with no marker left', () => {
    expect(formOf('{{أصبحنا|أمسينا}} لله', 'sabah')).toBe('أصبحنا لله');
    expect(formOf('{{أصبحنا|أمسينا}} لله', 'masaa')).toBe('أمسينا لله');
    expect(formOf('سبحان الله', 'masaa')).toBe('سبحان الله');
  });
});

describe('parseVariants', () => {
  it('passes through text with no markers', () => {
    expect(parseVariants('سبحان الله')).toEqual([{ type: 'text', value: 'سبحان الله' }]);
  });

  it('parses a single variant pair', () => {
    expect(parseVariants('{{أصبحنا|أمسينا}}')).toEqual([
      { type: 'variant', sabah: 'أصبحنا', masaa: 'أمسينا' },
    ]);
  });

  it('parses text around a variant', () => {
    expect(parseVariants('قل {{أصبحنا|أمسينا}} ثم')).toEqual([
      { type: 'text', value: 'قل ' },
      { type: 'variant', sabah: 'أصبحنا', masaa: 'أمسينا' },
      { type: 'text', value: ' ثم' },
    ]);
  });

  it('parses multiple variants', () => {
    expect(parseVariants('{{a|b}} و {{c|d}}')).toEqual([
      { type: 'variant', sabah: 'a', masaa: 'b' },
      { type: 'text', value: ' و ' },
      { type: 'variant', sabah: 'c', masaa: 'd' },
    ]);
  });

  it('allows an empty side', () => {
    expect(parseVariants('{{|وَ}}')).toEqual([{ type: 'variant', sabah: '', masaa: 'وَ' }]);
  });

  it('rejects an unclosed marker', () => {
    expect(() => parseVariants('{{أصبحنا|أمسينا')).toThrow(/Malformed variant marker/u);
  });

  it('rejects a stray closer', () => {
    expect(() => parseVariants('أصبحنا}} ثم')).toThrow(/Malformed variant marker/u);
  });

  it('rejects a bare pipe outside a marker', () => {
    expect(() => parseVariants('أصبحنا | أمسينا')).toThrow(/Malformed variant marker/u);
  });

  it('rejects three sides', () => {
    expect(() => parseVariants('{{a|b|c}}')).toThrow(/Malformed variant marker/u);
  });

  it('rejects nesting', () => {
    expect(() => parseVariants('{{a{{b|c}}|d}}')).toThrow(/Malformed variant marker/u);
  });
});
