# Promo films: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. This repo forbids subagents unless the owner asks. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `making-a-promo` skill and the `promo:*` scripts that turn a film folder (HTML scenes and simulator clips) into a finished 1080 by 1920 MP4.

**Architecture:** A film is `promo/<slug>/film.html`, scenes timed by CSS animations. `scripts/promo/page.ts` opens it in the installed Brave or Chrome through `playwright-core`, injects the site's tokens, fonts, emblems, mark, and section colors, and seeks it to any time. `check`, `sheet`, and `render` are Effect programs on top of it. The rules a frame must meet are pure functions in `scripts/promo/rules.ts`.

**Tech Stack:** Bun, Effect 4, `playwright-core` (dev), ffmpeg 8 on `PATH`, Argent for the simulator.

**Spec:** `docs/proposals/2026-11-27-promo-video/design.md`

## Global Constraints

- Every script is an Effect program run by `run` from `scripts/run.ts`; arguments are decoded with `argumentsOf`.
- No code comments. No em-dashes anywhere.
- Names follow `docs/naming.md`: `<noun>Of`, `<noun>Problems`, `read<Noun>`, SCREAMING_SNAKE module constants.
- Tests are `bun:test`, beside the source, `describe` named for the function, `test` names are sentences.
- The frame is 1080 by 1920 at 30 fps. Output: H.264, `yuv420p`, CRF 18, `+faststart`, a silent stereo AAC track.
- Safe zone: x 120 to 888, y 288 to 1248; below y 840 the right edge is 780.
- Text under 28 px, a title line over 5 words, an em-dash, and «وردي» without its kasra are problems.
- A film is 15 to 30 seconds.
- The browser comes from the list in `scripts/chromium.ts`; it must play H.264 (`canPlayType('video/mp4; codecs="avc1.42E01E"')`), so plain Chromium is refused with a clear message.
- `bun run ci` passes at the end of every task.

## Review Focus

1. A clip that ends before its scene: the film freezes on its last frame. Expect a problem line naming the clip and the second. (Task 1, `clipProblems`.)
2. Frame 0 rendered before the fonts load: the hook shows a fallback font. Expect `seek` to await `document.fonts.ready` and the sheet's first frame in IBM Plex Sans Arabic. (Task 2, verification step.)
3. A seek that resolves before the video frame is painted: a black or stale clip frame. Expect `seek` to await `seeked`, then one `requestVideoFrameCallback` or two animation frames. (Task 2.)
4. A film folder whose path has spaces or Arabic: a broken `file://` URL. Expect `pathToFileURL` everywhere. (Task 2.)
5. A `data-duration` that is not a whole number of frames: one frame too few or too many. Expect `frameCount(24.5, 30) === 735`, and times `i / 30`. (Task 1.)

---

### Task 1: The rules

**Files:**

- Create: `scripts/promo/rules.ts`
- Test: `scripts/promo/rules.test.ts`

**Interfaces:**

- Produces:
  - `FPS = 30`, `WIDTH = 1080`, `HEIGHT = 1920`, `SAFE = { left: 120, right: 888, narrowRight: 780, narrowFrom: 840, top: 288, bottom: 1248 }`, `MIN_TEXT = 28`, `MAX_WORDS = 5`, `LENGTH = { min: 15, max: 30 }`.
  - `type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }`
  - `type TextBox = Box & { readonly text: string; readonly size: number; readonly quote: boolean }` (`quote` is true inside `[data-quote]`, a dhikr copied verbatim, exempt from the word limit only).
  - `type ClipState = { readonly name: string; readonly start: number; readonly duration: number }`
  - `type Sample = { readonly time: number; readonly texts: ReadonlyArray<TextBox>; readonly clips: ReadonlyArray<ClipState> }`
  - `frameCount(duration: number, fps?: number): number` (rounded)
  - `timesOf(duration: number, step: number): ReadonlyArray<number>` (0, step, ... below duration)
  - `isSafe(box: Box): boolean`
  - `textProblems(time: number, box: TextBox): ReadonlyArray<string>`
  - `clipProblems(time: number, clip: ClipState): ReadonlyArray<string>`
  - `sampleProblems(sample: Sample): ReadonlyArray<string>` (texts and clips, plus "frame 0 shows nothing" when `time === 0` and both lists are empty)
  - `lengthProblems(duration: number): ReadonlyArray<string>`
  - `timeLabel(time: number): string` (`"6.5s"`)

- [ ] **Step 1: Write the failing tests**

```ts
describe('frameCount', () => {
  test('rounds a duration to whole frames', () => {
    expect(frameCount(24.5)).toBe(735);
    expect(frameCount(20)).toBe(600);
  });
});
describe('timesOf', () => {
  test('samples from zero up to the end', () => {
    expect(timesOf(2, 0.5)).toEqual([0, 0.5, 1, 1.5]);
  });
});
describe('isSafe', () => {
  test('keeps a box inside the zone', () => {
    expect(isSafe({ x: 120, y: 288, width: 768, height: 400 })).toBe(true);
  });
  test('refuses a box under the right rail low on the frame', () => {
    expect(isSafe({ x: 200, y: 900, width: 650, height: 100 })).toBe(false);
  });
  test('refuses a box above the zone', () => {
    expect(isSafe({ x: 200, y: 200, width: 300, height: 100 })).toBe(false);
  });
});
describe('textProblems', () => {
  const line = { x: 200, y: 400, width: 500, height: 100, size: 80, quote: false };
  test('passes a short line in the zone', () => {
    expect(textProblems(1, { ...line, text: 'أذكارك في وقتها' })).toEqual([]);
  });
  test('names small text', () => {
    expect(textProblems(1, { ...line, size: 24, text: 'وِردي' })).toEqual([
      '1s: «وِردي» is 24 px, under 28',
    ]);
  });
  test('names a line over five words, but not a quote', () => {
    const text = 'سبحان الله وبحمده سبحان الله العظيم';
    expect(textProblems(1, { ...line, text })).toEqual([`1s: «${text}» has 6 words, over 5`]);
    expect(textProblems(1, { ...line, text, quote: true })).toEqual([]);
  });
  test('names the name without its kasra', () => {
    expect(textProblems(2, { ...line, text: 'وردي' })).toEqual([
      '2s: «وردي» needs the kasra: وِردي',
    ]);
  });
  test('names an em-dash', () => {
    expect(textProblems(0, { ...line, text: 'صباح — مساء' })).toEqual([
      '0s: «صباح — مساء» has an em-dash',
    ]);
  });
  test('names text outside the zone', () => {
    expect(textProblems(3, { ...line, y: 100, text: 'وِردي' })).toEqual([
      '3s: «وِردي» is outside the safe zone',
    ]);
  });
});
describe('clipProblems', () => {
  test('names a clip that has run out', () => {
    expect(clipProblems(9, { name: 'search.mp4', start: 4, duration: 3 })).toEqual([
      '9s: search.mp4 ended at 7s',
    ]);
  });
  test('passes a clip still playing', () => {
    expect(clipProblems(6, { name: 'search.mp4', start: 4, duration: 3 })).toEqual([]);
  });
});
describe('sampleProblems', () => {
  test('names an empty first frame', () => {
    expect(sampleProblems({ time: 0, texts: [], clips: [] })).toEqual([
      '0s: frame 0 shows nothing: open on the hook',
    ]);
  });
});
describe('lengthProblems', () => {
  test('names a film outside 15 to 30 seconds', () => {
    expect(lengthProblems(12)).toEqual(['the film is 12s, outside 15s to 30s']);
    expect(lengthProblems(24)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `bun test scripts/promo/rules.test.ts`
Expected: FAIL, cannot find `./rules.ts`.

- [ ] **Step 3: Implement `scripts/promo/rules.ts`**

Words are counted with `text.trim().split(/\s+/)`. A clip has run out when `time > start + duration + 1 / FPS`. `isSafe` uses `SAFE.narrowRight` when the box's bottom passes `SAFE.narrowFrom`. Use `Array` from `effect` where it reads better, plain arrays otherwise.

- [ ] **Step 4: Run them and see them pass**

Run: `bun test scripts/promo/rules.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/promo/rules.ts scripts/promo/rules.test.ts
git commit -m "feat: the rules a promo frame must meet"
```

### Task 2: The film page and the contact sheet

**Files:**

- Modify: `package.json` (dev dependency `playwright-core`; script `"promo:sheet": "bun scripts/promo/sheet.ts"`)
- Modify: `scripts/chromium.ts` (export `browser`)
- Modify: `.gitignore` (`/promo/*/clips/`, `/promo/*/out/`, `/.argent/`)
- Create: `scripts/promo/film.css`
- Create: `scripts/promo/page.ts`
- Create: `scripts/promo/sheet.ts`
- Create: `.claude/skills/making-a-promo/template/film.html`

**Interfaces:**

- Consumes: `browser` from `scripts/chromium.ts` (an `Effect<string, NoBrowser, FileSystem>`); `EMBLEMS`, `markSvg`, `sectionOf`, `OCCASION_IDS`; `FPS`, `WIDTH`, `HEIGHT`, `Sample`, `timesOf`, `timeLabel` from Task 1.
- Produces, in `page.ts`:
  - `class NoH264 extends Data.TaggedError('NoH264')<{ readonly message: string }>`, `class FilmBroken extends Data.TaggedError('FilmBroken')<{ readonly message: string }>`
  - `type Film = { readonly duration: number; readonly seek: (time: number) => Effect<void, FilmBroken>; readonly shot: () => Effect<Uint8Array, FilmBroken>; readonly sample: (time: number) => Effect<Sample, FilmBroken> }`
  - `openFilm(folder: string, options?: { readonly scale?: number }): Effect<Film, NoBrowser | NoH264 | FilmBroken, Scope | FileSystem | Path>` (the browser closes with the scope)
  - `filmArguments`: the `Schema` for `<folder> [--draft]` that the three scripts share, with `argumentsOf`.

The film contract the template and the skill teach:

- `film.html` is one `<main class="film" data-film data-duration="24">`, optionally `data-theme="dark"`, holding `<section class="film__scene" style="--start: 0; --end: 4.5">` elements.
- Inside a scene, an element enters at `--at` seconds after the scene's start, with one of the keyframes `film.css` defines: `film-enter` (from 8% to the right, `--spring`, with an `--ease-out` fade), `film-grow` (from 60%), `film-fade`, and `film-push` (to `--push`, 1.6 to 2, around `--focus`).
- `<svg data-emblem="nawm">`, `<svg data-mark>`, and `data-occasion="nawm"` (sets `--tone` and the class `tone`) are filled by the page.
- `<video data-clip src="clips/search.mp4" data-start="6.5" muted>`, `<img data-still src="clips/home.png">`.
- `[data-quote]` marks a dhikr copied verbatim.

- [ ] **Step 1: Add the dependency and the export**

Run: `bun add -d playwright-core`, then export `browser` from `scripts/chromium.ts` unchanged in behavior.
Expected: `bun run check` passes.

- [ ] **Step 2: Write `film.css` and the template**

`film.css` holds the `film` block: the stage, `film__scene`, `film__title`, `film__line`, `film__screen` (the clip or still, flat, corner radius 56 px at a 1206 px wide screen scaled to its box, `object-fit: cover`), `film__emblem`, `film__end`, `film__name`, `film__domain`, and the four keyframes. A scene shows only from `--start` to `--end`: two zero-length opacity animations, one at each, so a seek alone decides what shows. Every value comes from a token where one exists. The template is a 16-second film with no clips: a title hook on paper, a scene on «أذكار المساء»'s color with its emblem, a still placeholder box labelled «لقطة: الصفحة الرئيسية», and the end card (mark, «وِردي», `wirdy.site`).

- [ ] **Step 3: Write `page.ts`**

`openFilm` reads `film.html`, wraps it in `<!doctype html><html lang="ar" dir="rtl">` with `<base href>` set to the folder's `pathToFileURL`, and a `<style>` holding `src/styles/fonts.css` (each `url("@fontsource/` rewritten to the `node_modules/@fontsource/` file URL), `src/styles/tokens.css`, and `film.css`. It writes that page into a scoped temp directory, launches the browser headless with `executablePath`, opens a page at 1080 by 1920 with `deviceScaleFactor: scale ?? 1`, fails with `NoH264` when the browser cannot play H.264, fills the emblems, mark, and tones with one `evaluate` (emblem shapes from `EMBLEMS`, as `scripts/opengraph/shared.ts` draws them), copies `data-theme` to `<html>`, and pauses every animation.

`seek(time)` sets every `Animation.currentTime` to `time * 1000`, sets each clip's `currentTime` to `clamp(time - start, 0, duration - 1 / FPS)`, awaits `seeked` for each that moved, then one `requestVideoFrameCallback` per clip, then `document.fonts.ready`. `sample(time)` seeks, then returns every visible element with a direct text node (`checkVisibility({ opacityProperty: true, visibilityProperty: true })`) as a `TextBox`, and every visible clip as a `ClipState`. `shot()` is a PNG screenshot.

- [ ] **Step 4: Write `sheet.ts`**

`bun run promo:sheet <folder>`: opens the film at scale 0.25, shoots each time in `timesOf(duration, 0.5)`, then draws a second page in the same browser: a grid of 8 columns, each frame with its `timeLabel` under it, and saves `out/sheet.png`. Prints the path.

- [ ] **Step 5: Verify on the template**

Run: `bun run promo:sheet .claude/skills/making-a-promo/template`
Expected: it prints `.../template/out/sheet.png`. Read the image: 32 frames, the hook at 0s in IBM Plex Sans Arabic (not a fallback serif), the section's real color and emblem, the end card last.

- [ ] **Step 6: Run the gate and commit**

Run: `bun run ci`
Expected: PASS.

```bash
git add package.json bun.lock .gitignore scripts/chromium.ts scripts/promo .claude/skills/making-a-promo/template/film.html
git commit -m "feat: open a promo film in the browser and draw its contact sheet"
```

### Task 3: The check

**Files:**

- Create: `scripts/promo/check.ts`
- Modify: `package.json` (`"promo:check": "bun scripts/promo/check.ts"`)

**Interfaces:**

- Consumes: `openFilm`, `filmArguments`; `sampleProblems`, `lengthProblems`, `timesOf` from Task 1.

- [ ] **Step 1: Write `check.ts`**

Opens the film at scale 0.25, reports `lengthProblems(duration)`, every `src` under `clips/` that is missing on disk, then `sampleProblems` for each time in `timesOf(duration, 0.25)`, each distinct line once, in time order. Prints «ok» and exits 0 when there are none, else prints them and exits 1.

- [ ] **Step 2: Verify it passes the template and catches a broken copy**

Run: `bun run promo:check .claude/skills/making-a-promo/template`
Expected: `ok`.
Then copy the template to the scratchpad, change «وِردي» on the end card to «وردي» and the hook's top to 100 px, and run the check on the copy.
Expected: exit 1, with a line for the kasra and a line for the safe zone.

- [ ] **Step 3: Run the gate and commit**

Run: `bun run ci`
Expected: PASS.

```bash
git add package.json scripts/promo/check.ts
git commit -m "feat: check a promo film against its rules"
```

### Task 4: The clips and the render

**Files:**

- Create: `scripts/promo/clip.ts`
- Create: `scripts/promo/render.ts`
- Modify: `package.json` (`"promo:clip": "bun scripts/promo/clip.ts"`, `"promo:render": "bun scripts/promo/render.ts"`)

**Interfaces:**

- Consumes: `openFilm`, `filmArguments`; `frameCount`, `FPS` from Task 1.

- [ ] **Step 1: Write `clip.ts`**

`bun run promo:clip <folder> <recording> <name>` runs `ffmpeg -i <recording> -an -r 30 -c:v libx264 -g 1 -crf 16 -pix_fmt yuv420p <folder>/clips/<name>.mp4`, so every frame is a key frame and a seek lands exactly. Prints the path.

- [ ] **Step 2: Write `render.ts`**

`bun run promo:render <folder> [--draft]`: opens the film (scale 0.5 for a draft), seeks and shoots each frame `i / FPS` for `i < frameCount(duration)` into a scoped temp directory as `%05d.png`, printing progress every second of film, then runs `ffmpeg -framerate 30 -i <dir>/%05d.png -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -shortest -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/<slug>.mp4` (`out/<slug>-draft.mp4` and `-preset veryfast` for a draft). Prints the path.

- [ ] **Step 3: Verify end to end with a real recording**

Boot the iPhone 17 Pro simulator, run `argent disable video-watermark`, open `https://wirdy.site` in Safari, and record 6 seconds of scrolling the home page with `showTouches: false`. Copy the template to the scratchpad, run `promo:clip` on the recording as `home`, replace the placeholder box with `<video data-clip src="clips/home.mp4" data-start="...">`, and run `promo:check`, then `promo:render --draft`, then `promo:render`.
Expected: `ffprobe` on the final file shows `h264`, `1080x1920`, `30/1`, `aac`, and a duration within one frame of `data-duration`. Pull frames at three times with ffmpeg and read them: the clip moves, the titles are sharp, and nothing is black.

- [ ] **Step 4: Run the gate and commit**

Run: `bun run ci`
Expected: PASS.

```bash
git add package.json scripts/promo/clip.ts scripts/promo/render.ts
git commit -m "feat: render a promo film to MP4"
```

### Task 5: The skill and the docs

**Files:**

- Create: `.claude/skills/making-a-promo/SKILL.md`
- Modify: `docs/exceptions.md`, `docs/development.md`, `docs/branding/imagery.md`, `docs/README.md` (if it lists sections of docs that changed), `CLAUDE.md`, `README.md`

- [ ] **Step 1: Write the skill**

Frontmatter `name: making-a-promo`, `description: Use when the owner asks for a promo, ad, or social video of وِردي or one of its features, for X, TikTok, or Snapchat.` The body is the nine steps and the checklist of the design, in the voice of `verifying-a-dhikr`, with these specifics: the awareness line in step 1; `STORY.md` holds the three storylines, the pick, and the spec; the simulator setup (`xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`, `argent disable video-watermark` and turning it back on at the end, `showTouches: false`, the site added to the home screen, `run-sequence` for each take); recordings land in `.argent/recordings/` and go through `promo:clip`; start a film by copying `template/`; `promo:check`, `promo:sheet`, `promo:render --draft`, `promo:render`; `post.md` with each app's limit; no music, no voice.

- [ ] **Step 2: Update the docs**

- `docs/exceptions.md`: «Promo films render from HTML in a headless browser»: the ordinary way is a video editor or Remotion; this reuses the site's CSS with no React and no third party; `playwright-core` drives the installed browser and downloads none; the owner asked for it.
- `docs/development.md`: the four `promo:*` scripts, one line each, and the skill.
- `docs/branding/imagery.md`: a short «The promo films» section pointing to the skill.
- `CLAUDE.md` and `README.md`: `promo/` and `scripts/promo/` in the layout.

- [ ] **Step 3: Run the gate and commit**

Run: `bun run ci`
Expected: PASS.

```bash
git add .claude/skills/making-a-promo/SKILL.md docs CLAUDE.md README.md
git commit -m "docs: the making-a-promo skill"
```
