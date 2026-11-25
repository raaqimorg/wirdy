import { Array, Option } from 'effect';
import { OCCASIONS, type Occasion } from './occasions';

export type SoundPlace = {
  readonly before: string;
  readonly name: string;
  readonly path: string;
  readonly after: string;
};

const NAMES: ReadonlyArray<readonly [name: string, occasion: Occasion]> = Array.map(
  OCCASIONS,
  ({ title, id }) => [title, id] as const
);

export function soundPlace(sound: string): Option.Option<SoundPlace> {
  return Array.findFirst(NAMES, ([name, occasion]) => {
    const at = sound.indexOf(name);
    return at === -1
      ? Option.none()
      : Option.some({
          before: sound.slice(0, at),
          name,
          path: `/${occasion}/`,
          after: sound.slice(at + name.length),
        });
  });
}
