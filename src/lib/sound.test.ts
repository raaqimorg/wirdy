import { Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { soundPlace } from './sound';

describe('soundPlace', () => {
  it('finds the occasion that holds the sound form', () => {
    expect(Option.getOrNull(soundPlace('«غفرانك» وحدها ثابتة، وهي في أذكار الأحوال.'))).toEqual({
      before: '«غفرانك» وحدها ثابتة، وهي في ',
      name: 'أذكار الأحوال',
      path: '/ahwal/',
      after: '.',
    });
  });

  it('names a section by its full title', () => {
    expect(Option.getOrNull(soundPlace('بغير هذه الزيادة في أذكار كل وقت.'))?.path).toBe(
      '/mutlaq/'
    );
  });

  it('finds no place when no form is on the site', () => {
    expect(Option.isNone(soundPlace('حسّنه الألباني، ثم تراجع عنه وضعّفه.'))).toBe(true);
  });
});
