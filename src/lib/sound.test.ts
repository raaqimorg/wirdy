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

  it('knows أذكار عامة by its name in a sentence', () => {
    expect(Option.getOrNull(soundPlace('بغير هذه الزيادة في الأذكار العامة.'))?.path).toBe(
      '/mutlaq/'
    );
  });

  it('finds no place when no form is on the site', () => {
    expect(Option.isNone(soundPlace('حسّنه الألباني، ثم تراجع عنه وضعّفه.'))).toBe(true);
  });
});
