import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import { PALETTE } from '../lib/palette';
import {
  ARC,
  DEEP_LIGHTNESS,
  LIGHTNESS,
  NIGHT,
  chromaOf,
  contrast,
  hexFromOklab,
  hexFromOklch,
  oklabOf,
} from '../lib/tone';

const STYLES = join(process.cwd(), 'src/styles');
const COMPONENTS = join(process.cwd(), 'src/components');

const read = (file: string) => readFileSync(join(STYLES, file), 'utf8');
const pascal = (name: string) =>
  name.replaceAll(/(^|-)([a-z])/gu, (_, __, c: string) => c.toUpperCase());

const blocks = readdirSync(join(STYLES, 'components')).map((file) => file.replace('.css', ''));
const sheets = ['tokens.css', 'base.css', 'utilities.css', 'fonts.css'];
const everything = [...sheets, ...blocks.map((block) => `components/${block}.css`)].map((file) =>
  read(file)
);
const all = everything.join('\n');
const tokens = read('tokens.css');

const panelOf = (block: string) =>
  read(`components/${block}.css`)
    .match(/\.[\w-]+__panel \{[\s\S]*?@media \(min-width: 40rem\) \{[\s\S]*?\n\}\n/u)![0]
    .replaceAll(block, 'menu');

const declarations = (block: string) =>
  [...block.matchAll(/(--[\w-]+): ([^;]+);/gu)].map(([, name, value]) => `${name}: ${value}`);
const dark = {
  device: tokens.match(/:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/u)![1]!,
  chosen: tokens.match(/:root\[data-theme="dark"\] \{([^}]*)\}/u)![1]!,
};
const light = tokens.match(/^:root \{([\s\S]*?)^\}/mu)![1]!;

describe('the tokens', () => {
  it('are all defined', () => {
    const used = new Set([...all.matchAll(/var\((--[\w-]+)/gu)].map(([, name]) => name!));
    const defined = new Set([...all.matchAll(/^\s*(--[\w-]+):/gmu)].map(([, name]) => name!));
    const inline = new Set(['--tone']);
    expect([...used].filter((name) => !defined.has(name) && !inline.has(name))).toEqual([]);
  });

  it('are all used', () => {
    const defined = [...all.matchAll(/^\s*(--[\w-]+):/gmu)].map(([, name]) => name!);
    expect(
      defined.filter((name) => !all.includes(`var(${name})`) && !all.includes(`var(${name},`))
    ).toEqual([]);
  });

  it('are the same in the dark mode of the device and in a chosen dark mode', () => {
    expect(declarations(dark.device)).toEqual(declarations(dark.chosen));
  });

  it('change in the dark only where the light has a value', () => {
    const names = declarations(light).map((line) => line.split(':')[0]);
    for (const line of declarations(dark.chosen)) expect(names).toContain(line.split(':')[0]);
  });

  it('give the poster papers in the poster menu the panel by day and by night', () => {
    expect(valueOf(light, '--color-panel-day')).toBe(valueOf(light, '--color-panel'));
    expect(valueOf(light, '--color-panel-night')).toBe(valueOf(dark.chosen, '--color-panel'));
  });

  it('match the palette that the scripts and the metadata use', () => {
    expect(light).toContain(`--color-paper: ${PALETTE.paper};`);
    expect(light).toContain(`--color-panel: ${PALETTE.panel};`);
    expect(light).toContain(`--color-eggshell: ${PALETTE.eggshell};`);
    expect(light).toContain(`--color-ink: ${PALETTE.ink};`);
    expect(light).toContain(`--color-ink-muted: ${PALETTE.inkMuted};`);
    expect(dark.chosen).toContain(`--color-paper: ${PALETTE.paperDark};`);
  });

  it('give the posters the colors of the night and the tone shares the site uses', () => {
    expect(light).toContain(`--color-line: ${PALETTE.line};`);
    expect(light).toContain(`--tone-ink: ${PALETTE.toneInk};`);
    expect(dark.chosen).toContain(`--color-panel: ${PALETTE.panelDark};`);
    expect(dark.chosen).toContain(`--color-ink: ${PALETTE.inkDark};`);
    expect(dark.chosen).toContain(`--color-ink-muted: ${PALETTE.inkMutedDark};`);
    expect(dark.chosen).toContain(`--color-line: ${PALETTE.lineDark};`);
    expect(dark.chosen).toContain(`--tone-ink: ${PALETTE.toneInkDark};`);
    expect(dark.chosen).toContain(`--tone-shade: ${PALETTE.toneShadeDark};`);
  });

  it('darken the tones at night by the same share as the tone rule', () => {
    expect(light).toContain('--tone-shade: 0%;');
    expect(dark.chosen).toContain(`--tone-shade: ${Math.round((1 - NIGHT) * 100)}%;`);
  });
});

const valueOf = (block: string, name: string) =>
  block.match(new RegExp(`${name}: ([^;]+);`, 'u'))![1]!;
const shareOf = (value: string) => Number(value.match(/([\d.]+)%/u)![1]) / 100;
const hexFromHsl = (value: string) => {
  const [hue, saturation, lightness] = value.match(/[\d.]+/gu)!.map(Number) as [
    number,
    number,
    number,
  ];
  const reach = (saturation / 100) * Math.min(lightness / 100, 1 - lightness / 100);
  const channel = (offset: number) => {
    const turn = (offset + hue / 30) % 12;
    const level = lightness / 100 - reach * Math.max(-1, Math.min(turn - 3, 9 - turn, 1));
    return Math.round(level * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
};
const mix = (one: string, other: string, share: number) => {
  const [first, second] = [oklabOf(one), oklabOf(other)];
  return hexFromOklab(
    [0, 1, 2].map((index) => first[index]! * (1 - share) + second[index]! * share) as [
      number,
      number,
      number,
    ]
  );
};
const toneRule = tokens.match(/^\.tone \{([^}]*)\}/mu)![1]!;
const WASH = shareOf(valueOf(toneRule, '--tone-wash'));
const MODES = [
  ['by day', light],
  ['at night', dark.chosen],
].map(([mode, block]) => ({
  mode: mode!,
  panel: hexFromHsl(valueOf(block!, '--color-panel')),
  ink: hexFromHsl(valueOf(block!, '--color-ink')),
  share: shareOf(valueOf(block!, '--tone-ink')),
}));
const HUES = [...Array.from({ length: ARC.span + 1 }, (_, step) => (ARC.from + step) % 360), 80];
const weakestText = (lightness: number, { panel, ink, share }: (typeof MODES)[number]) =>
  Math.min(
    ...HUES.flatMap((hue) => {
      const tone = hexFromOklch(lightness, chromaOf(lightness), hue);
      const text = mix(tone, ink, share);
      return [contrast(text, panel), contrast(text, mix(tone, panel, WASH))];
    })
  );

describe('the tone text', () => {
  it.each(
    [LIGHTNESS, DEEP_LIGHTNESS].flatMap((lightness) =>
      MODES.map((mode) => [lightness, mode.mode, mode] as const)
    )
  )('keeps 4.5:1 at %s %s, on the panel and on the wash', (lightness, _, mode) => {
    expect(weakestText(lightness, mode)).toBeGreaterThanOrEqual(4.5);
  });

  it('sets the deep tones at the deepest lightness that keeps it readable at night', () => {
    const [, night] = MODES;
    expect(weakestText(DEEP_LIGHTNESS - 0.01, night!)).toBeLessThan(4.5);
  });
});

const faces = [...all.matchAll(/([^{}]+)\{[^{}]*font-family: var\(--font-([\w-]+)\)/gu)].map(
  ([, selector, face]) => ({ selector: selector!.trim(), face: face! })
);

describe('the faces', () => {
  it('set the content faces only on the words of a dhikr, a hadith, or the Quran', () => {
    expect(
      faces
        .filter(({ face }) => face !== 'ui')
        .map(({ selector }) => selector)
        .toSorted()
    ).toEqual(
      [
        '.entry--quran .entry__text',
        '.entry__row .entry__words',
        '.entry__text',
        '.salawat',
        '.search-row__words',
        '.surah__ayah-end',
      ].toSorted()
    );
  });

  it('give everything else the interface face, from the body down', () => {
    expect(faces.find(({ selector }) => selector === 'body')?.face).toBe('ui');
  });
});

describe('the banner', () => {
  const banner = read('components/banner.css');

  it('straightens its corners over twice their radius, ending as its edge reaches the bar', () => {
    expect(banner).toContain(
      'animation-timeline: view(block calc(env(safe-area-inset-top) + var(--size-bar)) 0);'
    );
    expect(banner).toContain(
      'animation-range: exit calc(100% - var(--radius-large) * 2) exit 100%;'
    );
    expect(banner).toMatch(
      /@keyframes banner-flatten \{\s*to \{\s*border-end-start-radius: 0;\s*border-end-end-radius: 0;/u
    );
  });
});

describe('the component styles', () => {
  it('are each imported once', () => {
    const imports = [...read('index.css').matchAll(/"\.\/components\/([\w-]+)\.css"/gu)];
    expect(imports.map(([, name]) => name!).toSorted()).toEqual(blocks.toSorted());
  });

  it.each(blocks)('%s belongs to a component of the same name', (block) => {
    expect(existsSync(join(COMPONENTS, `${pascal(block)}.astro`))).toBe(true);
  });

  it("gives the bar's two menus one panel, a sheet on a phone and a menu under the bar from 40rem", () => {
    expect(panelOf('poster-menu')).toBe(panelOf('section-menu'));
  });

  it.each(blocks)('%s styles only its own block', (block) => {
    const css = read(`components/${block}.css`).replaceAll(/@keyframes[\s\S]*?\n\}/gu, '');
    const names = [...css.matchAll(/\.([a-z][\w-]*)/gu)].map(([, name]) => name!);
    const own = new RegExp(`^${block}(__|--|$)`, 'u');
    expect(names.filter((name) => !own.test(name))).toEqual([]);
  });
});

const lintErrorsOf = async (code: string) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(STYLES, 'components', 'badge.css'),
    configFile: join(process.cwd(), '.stylelintrc.json'),
  });
  return results.flatMap(({ warnings }) => warnings.map(({ rule }) => rule));
};

describe('the style lint', () => {
  it.each([
    ['a raw color', '.badge { color: oklch(0.5 0.1 80); }'],
    ['a hex color', '.badge { background: #fff; }'],
    ['a named color', '.badge { border-color: white; }'],
    ['a spacing in em', '.badge { margin-inline: 0.5em; }'],
    ['a spacing in percent', '.badge { padding-block: 2%; }'],
    ['a spacing in pixels', '.badge { gap: 3px; }'],
    ['a type size in em', '.badge { font-size: 0.9em; }'],
    ['a type size by keyword', '.badge { font-size: small; }'],
    ['a corner on one side', '.badge { border-start-start-radius: 4px; }'],
    ['a corner in percent', '.badge { border-radius: 50%; }'],
    ['a line by keyword', '.badge { border-width: thin; }'],
  ])('refuses %s outside the tokens', async (_, code) => {
    expect(await lintErrorsOf(code)).not.toEqual([]);
  });

  it('accepts the tokens and zero', async () => {
    const code = [
      '.badge {',
      '  margin: 0 calc(var(--space-2) * -1);',
      '  border-radius: var(--radius-full);',
      '  font-size: var(--text-small);',
      '  color: var(--color-ink);',
      '}',
      '',
    ].join('\n');
    expect(await lintErrorsOf(code)).toEqual([]);
  });
});
