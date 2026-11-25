import { OCCASIONS, type Occasion } from './occasions';

export type SoundPlace = { before: string; name: string; path: string; after: string };

const NAMES: [name: string, occasion: Occasion][] = [
  ...OCCASIONS.map(({ heading, id }): [string, Occasion] => [heading, id]),
  ['الأذكار العامة', 'mutlaq'],
];

export function soundPlace(sound: string): SoundPlace | null {
  for (const [name, occasion] of NAMES) {
    const at = sound.indexOf(name);
    if (at === -1) continue;
    return {
      before: sound.slice(0, at),
      name,
      path: `/${occasion}/`,
      after: sound.slice(at + name.length),
    };
  }
  return null;
}
