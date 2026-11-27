import { Console, Data, Effect, FileSystem, Option, Path, Schema } from 'effect';
import { ChildProcess, ChildProcessSpawner } from 'effect/process';
import { chromium, webkit, type Browser, type Page } from 'playwright-core';
import { PALETTE } from '../../src/lib/palette.ts';
import { browser } from '../chromium.ts';
import { root } from '../opengraph/shared.ts';
import { argumentsOf, run, UsageError } from '../run.ts';
import { findingsOf, flagsOf, readCensus, summaryOf, type Flag, type Place } from './census.ts';
import { changeLabel, changesOf, flagChangesOf, type Keyed } from './compare.ts';
import {
  ENGINES,
  MODES,
  STATES,
  VIEWPORTS,
  type Engine,
  type Mode,
  type State,
  type Viewport,
} from './states.ts';

class BuildFailed extends Data.TaggedError('BuildFailed')<{ readonly message: string }> {}

class BrowserFailed extends Data.TaggedError('BrowserFailed')<{ readonly message: string }> {}

const USAGE =
  'bun run drift[:check] [--engine chromium|webkit] [--viewport 390|820|1180|1440] [--mode light|dark] [--only <part of a state name>] [--out <dir>] [--no-build]';
const EXTRAS = Object.fromEntries(
  Object.entries(PALETTE).map(([name, value]) => [`PALETTE.${name}`, value])
);
const NOW = new Date('2026-11-27T09:00:00+03:00');
const CONCURRENCY = 6;
const TIMEOUT = 60_000;

type Options = {
  readonly check: boolean;
  readonly build: boolean;
  readonly out: string;
  readonly engines: ReadonlyArray<Engine>;
  readonly viewports: ReadonlyArray<Viewport>;
  readonly modes: ReadonlyArray<Mode>;
  readonly only: Option.Option<string>;
};

const valueAfter = (given: ReadonlyArray<string>, flag: string) => {
  const at = given.indexOf(flag);
  return at === -1 ? Option.none() : Option.fromUndefinedOr(given[at + 1]);
};

const SWITCHES = new Set(['--check', '--no-build']);
const VALUED = new Set(['--engine', '--viewport', '--mode', '--only', '--out']);

const isKnown = (given: ReadonlyArray<string>) =>
  given.every(
    (word, at) => SWITCHES.has(word) || VALUED.has(word) || VALUED.has(given[at - 1] ?? '')
  );

const optionsOf = (given: ReadonlyArray<string>) => {
  const engine = valueAfter(given, '--engine');
  const viewport = valueAfter(given, '--viewport');
  const mode = valueAfter(given, '--mode');
  const options: Options = {
    check: given.includes('--check'),
    build: !given.includes('--no-build'),
    out: Option.getOrElse(valueAfter(given, '--out'), () => '.drift'),
    engines: ENGINES.filter((name) => Option.getOrElse(engine, () => name) === name),
    viewports: VIEWPORTS.filter(({ name }) => Option.getOrElse(viewport, () => name) === name),
    modes: MODES.filter((name) => Option.getOrElse(mode, () => name) === name),
    only: valueAfter(given, '--only'),
  };
  const empty = [options.engines, options.viewports, options.modes].some(
    (list) => list.length === 0
  );
  return isKnown(given) && !empty
    ? Effect.succeed(options)
    : Effect.fail(new UsageError({ message: `usage: ${USAGE}` }));
};

const tokenNames = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const css = yield* fs.readFileString(path.join(root, 'src', 'styles', 'tokens.css'));
  return [...new Set([...css.matchAll(/^\s*(--[a-z0-9-]+):/gmu)].map(([, name]) => name ?? ''))];
});

const built = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const code = yield* spawner.exitCode(
    ChildProcess.make('bun', ['run', 'build'], { cwd: root, stdout: 'ignore', stderr: 'inherit' })
  );
  if (code !== 0)
    return yield* new BuildFailed({ message: `astro build exited with ${String(code)}` });
});

const commit = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  return (yield* spawner.string(
    ChildProcess.make('git', ['rev-parse', '--short', 'HEAD'], { cwd: root })
  )).trim();
});

const served = (dist: string) =>
  Effect.acquireRelease(
    Effect.sync(() =>
      Bun.serve({
        port: 0,
        fetch: async (request) => {
          const asked = decodeURIComponent(new URL(request.url).pathname);
          const direct = Bun.file(`${dist}${asked}`);
          if (!asked.endsWith('/') && (await direct.exists())) return new Response(direct);
          const index = Bun.file(`${dist}${asked.replace(/\/$/u, '')}/index.html`);
          if (await index.exists()) return new Response(index);
          return new Response(Bun.file(`${dist}/404.html`), {
            status: 404,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          });
        },
      })
    ),
    (server) => Effect.promise(() => server.stop(true))
  );

const work = <A>(label: string, task: () => Promise<A>) =>
  Effect.tryPromise({
    try: task,
    catch: (cause) => new BrowserFailed({ message: `${label}: ${String(cause)}` }),
  });

const launched = (engine: Engine) =>
  Effect.acquireRelease(
    engine === 'webkit'
      ? work('webkit', () => webkit.launch())
      : Effect.flatMap(
          Effect.mapError(browser, (error) => new BrowserFailed({ message: error.message })),
          (executablePath) => work('chromium', () => chromium.launch({ executablePath }))
        ),
    (opened) => Effect.promise(() => opened.close())
  );

const settle = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      if (!(animation.timeline instanceof DocumentTimeline)) continue;
      try {
        animation.finish();
      } catch {
        animation.cancel();
      }
    }
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });
};

type Capture = { readonly place: Place; readonly flags: ReadonlyArray<Flag> };

const captured = (
  opened: Browser,
  origin: string,
  names: ReadonlyArray<string>,
  shots: string,
  place: Place,
  viewport: Viewport,
  mode: Mode,
  state: State
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const label = `${place.engine} ${place.viewport} ${place.mode} ${place.state}`;
    const context = yield* Effect.acquireRelease(
      work(label, () =>
        opened.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.scale,
          hasTouch: viewport.touch,
          colorScheme: mode,
          reducedMotion: 'no-preference',
          locale: 'ar-SA',
          timezoneId: 'Asia/Riyadh',
          serviceWorkers: 'block',
        })
      ),
      (made) => Effect.promise(() => made.close())
    );
    const file = path.join(
      shots,
      place.engine,
      `${place.viewport}-${place.mode}`,
      `${place.state}.png`
    );
    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    const flags = yield* work(label, async () => {
      context.setDefaultTimeout(TIMEOUT);
      const page = await context.newPage();
      await page.clock.setFixedTime(NOW);
      await page.addInitScript((entries) => {
        for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
      }, state.storage ?? {});
      await page.goto(`${origin}${state.path}`, { waitUntil: 'load' });
      await settle(page);
      if (state.act !== undefined) await state.act(page);
      await settle(page);
      const reading = await page.evaluate(readCensus, { names, extras: EXTRAS });
      await page.screenshot({
        path: file,
        fullPage: state.shot === 'page',
        animations: 'disabled',
        caret: 'hide',
      });
      return flagsOf(reading);
    });
    return { place, flags };
  }).pipe(Effect.scoped);

const engineRun = (
  engine: Engine,
  options: Options,
  origin: string,
  names: ReadonlyArray<string>,
  shots: string
) =>
  Effect.gen(function* () {
    const opened = yield* launched(engine);
    const jobs = options.viewports.flatMap((viewport) =>
      options.modes.flatMap((mode) =>
        STATES.filter(
          (state) =>
            !(state.mouse === true && viewport.touch) &&
            Option.match(options.only, {
              onNone: () => true,
              onSome: (part) => state.name.includes(part),
            })
        ).map((state) => ({ viewport, mode, state }))
      )
    );
    const results = yield* Effect.forEach(
      jobs,
      ({ viewport, mode, state }) => {
        const place: Place = {
          engine,
          viewport: viewport.name,
          mode,
          state: state.name,
          page: state.path,
        };
        return captured(opened, origin, names, shots, place, viewport, mode, state).pipe(
          Effect.map((capture): Capture | string => capture),
          Effect.catchTag('BrowserFailed', (error) => Effect.succeed(error.message))
        );
      },
      { concurrency: CONCURRENCY }
    );
    return results;
  }).pipe(Effect.scoped);

const findingsSchema = Schema.Struct({
  findings: Schema.Array(
    Schema.Struct({ selector: Schema.String, property: Schema.String, value: Schema.String })
  ),
});

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const options = yield* optionsOf(yield* argumentsOf(Schema.Array(Schema.String), USAGE));
  const out = path.resolve(root, options.out);
  const set = path.join(out, options.check ? 'current' : 'baseline');
  if (options.build) yield* built;
  const names = yield* tokenNames;
  const server = yield* served(path.join(root, 'dist'));
  const origin = `http://localhost:${String(server.port)}`;
  if (options.check) yield* fs.remove(set, { recursive: true }).pipe(Effect.ignore);
  const shots = path.join(set, 'shots');
  const results = (yield* Effect.forEach(
    options.engines,
    (engine) => engineRun(engine, options, origin, names, shots),
    {
      concurrency: 'unbounded',
    }
  )).flat();
  const captures = results.filter((result): result is Capture => typeof result !== 'string');
  const failures = results.filter((result): result is string => typeof result === 'string');
  const findings = findingsOf(captures);
  yield* fs.writeFileString(
    path.join(set, 'census.json'),
    `${JSON.stringify({ commit: yield* commit, captures: captures.length, failures, findings }, null, 2)}\n`
  );
  yield* Console.log(summaryOf(findings, captures.length));
  for (const failure of failures) yield* Console.error(`failed: ${failure}`);
  yield* Console.log(`saved ${set}`);
  if (!options.check) return;

  const baseline = path.join(out, 'baseline');
  const diffs = path.join(out, 'diff');
  yield* fs.remove(diffs, { recursive: true }).pipe(Effect.ignore);
  const changes = yield* changesOf(path.join(baseline, 'shots'), shots, diffs);
  const before = yield* fs.readFileString(path.join(baseline, 'census.json')).pipe(
    Effect.flatMap((text) =>
      Schema.decodeUnknownEffect(Schema.fromJsonString(findingsSchema))(text)
    ),
    Effect.map(({ findings: found }) => found),
    Effect.orElseSucceed((): ReadonlyArray<Keyed> => [])
  );
  const flagChanges = flagChangesOf(before, findings);
  yield* fs.writeFileString(
    path.join(out, 'changes.json'),
    `${JSON.stringify({ changes, ...flagChanges }, null, 2)}\n`
  );
  if (changes.length === 0 && flagChanges.added.length === 0 && flagChanges.removed.length === 0) {
    yield* Console.log('nothing changed');
    return;
  }
  for (const change of changes) yield* Console.log(changeLabel(change));
  for (const { selector, property, value } of flagChanges.added)
    yield* Console.log(`new flag ${selector} ${property}: ${value}`);
  for (const { selector, property, value } of flagChanges.removed)
    yield* Console.log(`gone flag ${selector} ${property}: ${value}`);
  yield* Console.log(`diff images in ${diffs}`);
}).pipe(Effect.scoped);

run(program);
