# Promo films: design

A skill, `making-a-promo`, that makes a short vertical Arabic film about وِردي, or one of its features, for X, TikTok, and Snapchat. The agent writes the story, records the real site on an iPhone simulator, lays the film out in HTML with the site's own tokens, fonts, emblems, and motion, and renders a finished MP4.

## Why

The owner wants to advertise the site on social apps, in its own look. The agent already drives the simulator and already renders the site's sharing cards from HTML, so it can make the whole film: no editor, no stock assets, nothing redrawn from memory.

## Goals

- One command renders a finished MP4 the owner posts as it is, on X, TikTok, and Snapchat.
- Every screen in the film is the real site, recorded on the simulator.
- The film looks and moves like the site: its paper, inks, section colors, emblems, mark, fonts, `--spring`, and `--ease-out`.
- The words obey `docs/branding/identity.md`: say what a thing is, never claim more.
- A film can be rendered again later, with new footage, from the files it keeps.

## Non-goals

- Music. The owner asked for none.
- A voice, a presenter, an avatar, or captions of speech. The titles carry the words.
- Landscape or square versions. One 1080 by 1920 master serves all three apps.
- Posting the film. The owner posts it.
- A timeline editor or a preview app.

## Anti-goals

The film fails, however well it renders, if it:

- shows a screen, a button, or a dhikr that is not on the site;
- changes a dhikr's text, or states a virtue, a count, or a ruling its takhrij does not prove;
- claims more than `identity.md` says («الأفضل», «الأول», «ثوري», or any number the site does not show);
- writes «وردي» without the kasra, or drops ﷺ;
- puts a word under an app's own buttons and captions;
- opens on a logo or a black frame.

## Approaches

| Approach                                  | What it is                                                                                                                                                       | Trade-off                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. HTML scenes, our renderer** (picked) | Each film is one HTML page. A script drives the installed Brave or Chrome with `playwright-core`, steps the page frame by frame, and pipes the frames to ffmpeg. | Real motion and correct Arabic shaping in the site's own CSS. About 200 lines of renderer, and one dev dependency. Remotion and HyperFrames work this way inside. |
| B. ffmpeg only                            | Titles as still PNGs from `scripts/chromium.ts`, joined to the clips with ffmpeg filters.                                                                        | No new dependency, but the titles can only fade, slide, or zoom: a slideshow.                                                                                     |
| C. HyperFrames                            | The skill writes HyperFrames compositions and calls its CLI.                                                                                                     | A mature engine, but it sends usage to HeyGen, adds GSAP and an outside tool, and offers its app on every render.                                                 |

The owner picked A.

What we take from HyperFrames' guides (Apache-2.0, `heygen-com/hyperframes`, `skills/hyperframes/references/`): real UI only; frame 0 is the hook and the thumbnail; the 9:16 safe zone; short lines; three storylines in words before anything is built; a review of still frames before the render; the banned openers and words.

The skills.sh directory, searched on 2026-11-27 for video, promo, launch, TikTok, social, app demo, app store preview, screen recording, ad, and Arabic, had nothing better for real-UI films. The most installed video skills generate footage with paid AI models, which cannot show the real site. From `coreyhaines31/marketingskills` `ad-creative` we take: every claim grounded in a source, never invented; the viewer's awareness stage picks the hook; each caption checked against its app's limit.

## Decided

- A finished MP4, 1080 by 1920, 30 fps, H.264, with a silent AAC track (some apps refuse a file with no audio). No music.
- Approach A.
- 15 to 30 seconds. The story sets the length; nothing is padded.
- Footage from the live `https://wirdy.site`, added to the home screen so it runs without Safari's bars, with the status bar at 9:41. A feature not yet live is recorded from `bun run preview`.
- The work is on the branch `worktree-promo-video`.

## The skill

`.claude/skills/making-a-promo/SKILL.md`, a procedure in the voice of `verifying-a-dhikr`. Its steps:

1. **The one thing.** One line: what the viewer should know after the film, in their words. One viewer doing one real task on the site is the spine (opening «أذكار المساء» at sunset, finding a dhikr by search, seeing a takhrij). Name the viewer's awareness: one who already keeps adhkar from a booklet or another app (show what is different: the takhrij, the time of day), or one who does not yet (show the need). Read `docs/branding/identity.md` first. Every claim traces to it or to the site.
2. **Three storylines, in words.** Each with its device, its first two seconds exactly, its beats in a line, and its look in a line. Recommend one. The owner picks, or mixes. Nothing is recorded or built before the pick.
3. **The spec.** `promo/<slug>/STORY.md`: every shot by second, every title word for word, every clip to record, the section color of each scene.
4. **The footage.** Argent on an iPhone simulator (`argent-device-interact`, `argent-screen-recording`): boot it, set the status bar to 9:41 with full bars (`xcrun simctl status_bar`, since Argent has no tool for it), set light or dark as the story needs, open the site from its home screen icon, and record each clip with a scripted `run-sequence`, so a retake is the same take. Stills with `screenshot` at scale 1. Clips go to `promo/<slug>/clips/`.
5. **The film.** `promo/<slug>/film.html`, written with the classes of `scripts/promo/film.css` (below).
6. **The check.** `bun run promo:check <slug>` reports what breaks the rules. Fix every line.
7. **The review.** `bun run promo:sheet <slug>` draws a contact sheet: one frame each half second, in a grid, with its time. Read it, and the frames at each cut, against the checklist below. Show the owner the sheet.
8. **The render.** `bun run promo:render <slug>`, after the owner approves the sheet. Draft first (`--draft`, half size) if the owner wants to watch the motion before the final.
9. **The post text.** `promo/<slug>/post.md`: one caption for each app, in the site's voice, with the link, and a few hashtags, each within its app's limit (X counts 280 characters, a link as 23).

### The checklist

- Frame 0 shows the hook: a screen of the site or one line of title. Never black, never the mark alone.
- A new beat every 2 to 4 seconds. The payoff plays at normal speed.
- At most 5 words a line, one line of title on screen at a time. Cut words, never shrink the type.
- No text under 28 px.
- Text and the phone screen stay in the safe zone: 120 to 888 px across, 288 to 1248 px down; 120 to 780 px across below 840 px, where TikTok's buttons widen.
- Titles enter from the right, the way Arabic reads.
- Motion is the site's: `--spring` to move, `--ease-out` to fade, nothing eases in, grow from 60%.
- The screen is shown flat, never tilted in 3D, at 1.6 to 2 times its size when one part is the point.
- The end card: the mark and «وِردي» land in the last 10%, then `wirdy.site`, held 2 to 3 seconds.
- No first line of «نقدّم لكم» or «تعرّف على». None of «الأفضل», «الأول», «ثوري», «بسهولة», «بضغطة زر» unless the film shows it.
- A dhikr in a title is copied from its file in `src/content/`, letter for letter.
- No em-dashes.

## The film format

A film is a folder:

```
promo/<slug>/
  STORY.md     the storylines, the pick, and the spec (kept)
  film.html    the scenes (kept)
  post.md      the captions (kept)
  clips/       the recordings and stills (ignored)
  out/         the sheet, the draft, and the MP4 (ignored)
```

`.gitignore` gains `/promo/*/clips/` and `/promo/*/out/`. A film is rendered again by recording its clips again from `STORY.md`.

`film.html` holds only the scenes: a `<main data-film data-duration="24">` with one `<section data-scene>` after another. Time lives in CSS animations: each scene and each element inside it has an `animation` with a delay in seconds from the start of the film. The renderer injects everything else:

- the site's `src/styles/tokens.css`, so `--color-*`, `--tone-*`, `--font-*`, `--spring`, and `--ease-out` work, by day or by night (`data-theme` on the root);
- the fonts from `@fontsource`, as `scripts/opengraph/shared.ts` does;
- `scripts/promo/film.css`: the 1080 by 1920 stage, the scene, the title line, the phone screen (rounded to the device's corner, flat, on the scene's ground), the emblem, and the end card;
- the real drawings: `<svg data-emblem="nawm">` is filled from `src/lib/emblems.ts`, `<svg data-mark>` from `src/lib/mark.ts`;
- the section color: `data-occasion="nawm"` on an element sets its `--tone` from `src/lib/tone.ts`, as the site does.

A clip is a `<video data-clip src="clips/search.mp4" data-start="6.5">` inside its scene. Before the render, the renderer turns each clip into 30 fps with every frame a key frame, so a seek lands on the exact frame.

## The scripts

`scripts/promo/`, Effect programs run by `scripts/run.ts`, like the other scripts:

| File        | Script         | Work                                                                                                                                                                                                                                                                                               |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.ts`   |                | Opens a film in the browser (`playwright-core`, the executable from `scripts/chromium.ts`) at 1080 by 1920, injects the styles and drawings, pauses every animation, and seeks the film to a time: every `Animation.currentTime`, and every clip's `currentTime`, awaiting `seeked` and the fonts. |
| `check.ts`  | `promo:check`  | Reads the page every quarter second and reports, as sentences: text outside the safe zone, text under 28 px, a title line over 5 words, an em-dash, «وردي» without the kasra, a missing clip, a clip shorter than its scene, a black or empty frame 0.                                             |
| `sheet.ts`  | `promo:sheet`  | Saves one frame each half second, and draws them in a grid with their times into `out/sheet.png`.                                                                                                                                                                                                  |
| `render.ts` | `promo:render` | Seeks each frame, screenshots it, and pipes the PNGs into ffmpeg: `libx264`, `yuv420p`, CRF 18, `+faststart`, a silent AAC track. `--draft` renders at half size. Writes `out/<slug>.mp4`.                                                                                                         |
| `zone.ts`   |                | The safe zone and the rules on a box, a size, and a line, as pure functions, with `zone.test.ts` beside it (Bun, in `test:scripts`).                                                                                                                                                               |

`scripts/chromium.ts` exports its list of browsers, so both scripts find the same one.

## The docs

In the same change:

- `docs/exceptions.md`: «Promo films render from HTML in a headless browser», with the ordinary way (a video editor, or Remotion), why not, and `playwright-core`.
- `docs/development.md`: the `promo:*` scripts.
- `docs/branding/imagery.md`: a short section on the films, pointing to the skill.
- `CLAUDE.md` and `README.md`: `promo/` and `scripts/promo/` in the layout.

## Left to the builder

- The names of the classes in `film.css`, under `docs/design-system.md`'s naming, and how much of the site's existing CSS (the `.tone` mixes, the mark's style) it reuses rather than copies.
- How the renderer waits for a frame to settle (fonts, decoded clip frames) before the screenshot.
- The contact sheet's layout.
- The first film, to prove the skill end to end: a short one on one feature, picked with the owner through the skill's own steps.
