---
name: making-a-promo
description: Use when the owner asks for a promo, ad, or social video of وِردي or one of its features, for X, TikTok, or Snapchat.
---

# Making a promo

A promo is a short vertical film: 1080 by 1920, 30 fps, H.264 with a silent AAC track, 15 to 30 seconds. Every screen in it is the real site, recorded on an iPhone simulator. The titles, colors, emblems, mark, fonts, and motion are the site's own. No music, no voice, no captions of speech: the titles carry the words.

`docs/proposals/2026-11-27-promo-video/design.md` is the design, and this skill is the procedure. Read `docs/branding/identity.md` before you write a word.

## 1. The one thing

Write one line: what the viewer should know after the film, in their words. One viewer doing one real task on the site is the spine: opening «أذكار المساء» at sunset, finding a dhikr by search, seeing a takhrij.

Name the viewer's awareness. One who already keeps adhkar from a booklet or another app: show what is different (the takhrij, the time of day). One who does not yet: show the need. Every claim traces to `identity.md` or to a page of the site.

## 2. Three storylines, in words

Write three. For each: its device, its first two seconds exactly, its beats in one line, and its look in one line. Recommend one. The owner picks, or mixes. Record and build nothing before the pick.

## 3. The spec

Make `promo/<slug>/` by copying `.claude/skills/making-a-promo/template/`. Write `promo/<slug>/STORY.md`: the three storylines, the pick, and the spec. The spec lists every shot by second, every title word for word, every clip to record with its steps, and the section color of each scene.

## 4. The footage

Load `argent-device-interact` and `argent-screen-recording`.

1. Boot an iPhone simulator, and set the status bar: `xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`. Argent has no tool for it.
2. Set light or dark as the story needs.
3. Open `https://wirdy.site` in Safari, add it to the home screen, and open it from its icon, so no Safari bar shows. A feature not yet live is recorded from `bun run preview`.
4. Ask the owner to run `argent disable video-watermark` in their own terminal, outside Claude Code, and wait for it. The flag is global, and a worktree session refuses the command, so never run it yourself.
5. In the installed app, «الصورة» opens iOS's file screen, which has no way back. Make it the last tap of its take, and quit the web app after it (`xcrun simctl terminate <udid> com.apple.webapp`).
6. Record each clip with `screen-recording-start` (`showTouches: false`), one scripted `run-sequence` for the take, then `screen-recording-stop`. A retake runs the same sequence. Take a still with `screenshot` at scale 1.
   - Rehearse the take first without recording, and read each tap target from the element tree. Look at what a page chooses for itself: الصباح والمساء opens on the form the clock picks, so the take taps the other one, never the one already chosen.
   - Prefer the whole film in one take. Wait for each page with `await-ui-element` before its next tap, and end every scroll that a tap follows without momentum: a tap on a page still coasting only stops it.
   - To pass through a long page, flick with momentum (100 ms, twice) so it coasts and bounces like a hand; drag without momentum where the scroll must stop at a known place.
7. When the last clip is done, ask the owner to run `argent enable video-watermark` in their own terminal.

Argent saves a recording in `.argent/recordings/` of its project, which git ignores. Turn each into a clip with `bun run promo:clip promo/<slug> <recording> <name>`: 30 fps, every frame a key frame, so a seek lands on the exact frame. Clips go to `promo/<slug>/clips/`, which git ignores.

## 5. The film

Write `promo/<slug>/film.html`. It holds only the scenes; the scripts add the site's tokens, fonts, emblems, mark, and colors.

- One `<main class="film" data-film data-duration="24">`. Add `data-theme="dark"` for a night film.
- One `<section class="film__scene" style="--start: 4; --end: 8.5">` per scene, in seconds from the start of the film. A scene dissolves in over `--dissolve` (0.4 s; the first scene shows at once) and stays until the next has covered it. Its content is centered on the frame, both ways. `film__scene--tone` with `data-occasion="<id>"` puts it on that section's color. Give the title `--at: 0.2`, so it enters as the dissolve ends. A film of one walk through the site is better as one scene (below).
- A title is `<div class="film__title">` of `<p class="film__line">` lines, `film__line--small` for the second. Wrap ﷺ in `<span class="film__salawat">`.
- An element moves with `data-motion` and `style="--at: 0.4"`, seconds after its scene starts: `enter` (from the right, the way Arabic reads), `grow` (from 60%), `fade`, or `push` (to `--push`, 1.6 to 2, around `--focus`, such as `50% 30%`).
- `<video class="film__screen" data-clip src="clips/search.mp4" data-start="6.5" muted>` plays a clip from second 6.5 of the film. To push into part of a clip without the phone growing over the title, put `<video class="film__media" data-clip ... data-motion="push">` inside a `<div class="film__screen">`: the frame holds still and the picture grows inside it. `<img class="film__screen" data-still src="clips/home.png">` shows a still. `--screen` sets the width of the phone screen, and the frame draws a black phone body around it.
- `<svg class="film__emblem" data-emblem="<id>">` draws a section's emblem, and its lit shapes enter as on the site. `<svg class="film__mark" data-mark>` draws the mark (`data-mark="stage"` in cream, on a color).
- `data-quote` marks a dhikr copied from its file in `src/content/`, letter for letter. Only a quote may pass five words.
- The end card is `film__end`: `film__brand` holding the mark and `<span class="film__name">وِردي</span>`, then `<span class="film__domain">wirdy.site</span>`. The mark and name row is moved 4 px right by `film__brand`, because the tail of «وِردي» reaches left of its box.
- `<img class="film__card" src="clips/<file>.png" alt="" data-motion="grow">` lays an image the site makes (the file «الصورة» downloads, fetched from the live site) over the phone, centered on the frame.
- Keep the phone in one place: every scene with a phone has the same title size and line box, so the stack centers the same way. A title set smaller keeps the 88 px line box (`line-height: calc(88px * var(--leading-tight))`). One 88 px title and a 520 px screen fill the safe zone from top to bottom.
- Prefer one continuous shot: one scene for the whole film, one phone, and the titles taking turns above it. Stack the titles in `<div class="film__titles">`, each `data-motion="title"` with `--at` and `--out`: it enters from the right over a second and leaves to the left at `--out`. Leave half a second between one title's `--out` and the next one's `--at`. A title that shows at frame 0 takes `--at: -1`.
- Inside a `<div class="film__screen">`, the clips and stills stack in one place as `film__media`: `data-motion="until"` hides one at `--out`, `from` shows one at `--at` without a fade, and `fade` crossfades over `--for` seconds. Hide a clip before it ends, or the check names it.
- The site changes a page, a menu, or the theme at once, which reads as a hard cut or a flicker in the phone. Cover each with the frame before it: save that frame of the clip as `clips/before-<frame>.png` (`ffmpeg -vf "select=eq(n\,<frame>)"`), and lay it over the clip as `<img class="film__media" data-still data-motion="cover">` with `--at` on the film frame where the change shows; it fades out over `--for` (0.35 s), so the change dissolves.
- To take dead time or a bad frame out of a take, play it in several `film__media` layers inside `<div class="film__media film__take">`, each later layer `from` the cut with its `data-start` moved back by the time cut; cut only where the frames on both sides match. Hide the take on the same frame a still replaces it: a layer with an opacity animation paints above the layers after it.
- Set `data-start` half a frame past a whole frame (`-11.25` for frame 337), so every seek lands inside a frame and never on the edge of the one before.
- `data-motion="pop"` grows an image in at `--at` and drops it out at `--out`, for `film__card`.
- `data-motion="zoom"` on the phone is the camera: from `--at` over `--for` seconds, it scales by `--zoom` around `--focus` (in px of the phone's box, the bezel counted) and moves that point by `--zoom-x` and `--zoom-y`; it eases in and out, which a camera needs to feel smooth, and fades the phone out at `--out`. Find the focus by measuring the line in the clip, and the scale by the ratio of its type on the phone to the type it becomes.
- `<div class="film__night">` is the site's dark paper over the whole frame, under the phone; fade it in with the zoom when the film ends at night. A `<p class="film__lift" data-motion="lift">` inside it is a line of the screen lifted out as type: it shows at `--at`, under the phone, exactly where the zoom left that line, and brightens as the phone fades. Measure the zoomed line and the typeset line in the same frames and match them to the pixel.

## 6. The check

Run `bun run promo:check promo/<slug>`. It reads the film every quarter second and names text outside the safe zone, text under 28 px, a line over five words, an em-dash, tashkil in a title, «وردي» without its kasra, a missing clip, a clip that ends before its scene, an empty frame 0, and a film outside 15 to 30 seconds. Fix every line until it prints «ok».

## 7. The review

Run `bun run promo:sheet promo/<slug>`. It saves `out/sheet.png`: a frame each half second, with its time. Read it, and the frames at each cut, against the checklist below. Then measure, never assume: pull frames from the render with ffmpeg as grayscale and find the ink against the paper, the title by its band and the phone by its black body. The title, the phone, and each end card row share the frame's center within 1 px, and the phone sits at the same pixels in every scene. Correct an offset by whole pixels and measure again. Then look for flicker, frame by frame: in each clip and in the render, find any frame that differs from both its neighbours while they match, any blank frame, and every frame that changes most of the picture at once; each must be a change you meant, and covered or cut if not. Show the owner the sheet.

## 8. The render

After the owner approves the sheet, run `bun run promo:render promo/<slug>`. It writes `out/<slug>.mp4`. Add `--draft` for a half-size draft, when the owner wants to see the motion first. Check it with `ffprobe`: `h264`, 1080 by 1920, `30/1`, `aac`, and the film's length.

## 9. The post text

Write `promo/<slug>/post.md`: one caption for X, one for TikTok, one for Snapchat, in the site's voice, with the link and a few hashtags. Keep each within its app's limit: X counts 280 characters, a link as 23.

## The checklist

- Frame 0 shows the hook: a screen of the site or one line of title. Never black, never the mark alone.
- A new beat every 2 to 4 seconds. The payoff plays at normal speed.
- At most 5 words a line, one line of title on screen at a time. Cut words, never shrink the type.
- No text under 28 px.
- Text and the phone screen stay in the safe zone: 120 to 888 px across, 288 to 1248 px down; 120 to 780 px across below 840 px, where TikTok's buttons widen.
- Titles enter from the right.
- Motion is the site's: `--spring` to move, `--ease-out` to fade, grow from 60%. Only the camera eases in. Every change moves: no title, image, or screen appears or goes in a cut, but a still swapped for the identical frame of its clip.
- Few titles, and general: two or three for a 30 second film, each held 4 seconds or more. Let the screens tell: a title never names a tap, a section, or a mode the screen already shows, and never sets one part of the site apart as something different.
- No call to action. The end is the site's own line, or the mark and `wirdy.site`.
- The screen sits in its phone frame, centered, flat, never tilted in 3D, pushed to 1.6 to 2 times when one part is the point.
- The end card: the mark and «وِردي» land in the last 10%, then `wirdy.site`, held 2 to 3 seconds.
- No first line of «نقدّم لكم» or «تعرّف على». None of «الأفضل», «الأول», «ثوري», «بسهولة», «بضغطة زر» unless the film shows it.
- No screen, button, or dhikr that is not on the site. No virtue, count, or ruling its takhrij does not prove.
- Titles carry no tashkil (`docs/branding/identity.md`, the voice). Only «وِردي» keeps its kasra, and a `data-quote` keeps its source's marks.
- Write «وِردي» with its kasra, and never drop ﷺ.
- No em-dashes.

## Report

Give the owner the sheet, then the MP4's path and its `ffprobe` line, and `post.md`. Name any clip you could not record, and never stand in a drawing for a real screen.
