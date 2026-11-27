import { Console, Data, Effect, FileSystem, Path } from 'effect';
import { run } from '../run.ts';
import { filmArguments, openFilm } from './page.ts';
import { lengthProblems, sampleProblems, timesOf } from './rules.ts';

const SCALE = 0.25;
const STEP = 0.25;
const AT = /^[\d.]+s: /u;
const CLIP_SOURCE = /\bsrc="(clips\/[^"]+)"/gu;

class FilmProblems extends Data.TaggedError('FilmProblems')<{ readonly message: string }> {}

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { folder } = yield* filmArguments;
  const dir = path.resolve(folder);
  const film = yield* openFilm(dir, { scale: SCALE });
  const html = yield* fs.readFileString(path.join(dir, 'film.html'));
  const sources = [...new Set([...html.matchAll(CLIP_SOURCE)].map(([, source]) => source ?? ''))];
  const missing = yield* Effect.filter(sources, (source) =>
    Effect.map(fs.exists(path.join(dir, source)), (exists) => !exists)
  );
  const samples = yield* Effect.forEach(timesOf(film.duration, STEP), (time) => film.sample(time));
  const lines = [
    ...lengthProblems(film.duration),
    ...missing.map((source) => `${source} is missing`),
    ...samples.flatMap((sample) => sampleProblems(sample)),
  ];
  const problems = lines.filter(
    (line, index) =>
      lines.findIndex((other) => other.replace(AT, '') === line.replace(AT, '')) === index
  );
  if (problems.length === 0) {
    yield* Console.log('ok');
    return;
  }
  for (const problem of problems) yield* Console.log(problem);
  return yield* new FilmProblems({ message: `${String(problems.length)} problems in ${dir}` });
});

run(Effect.scoped(program));
