import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OCCASIONS } from '../lib/occasions';
import { PALETTE } from '../lib/palette';
import { NIGHT } from '../lib/tone';

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

  it('match the palette that the scripts and the metadata use', () => {
    expect(light).toContain(`--color-paper: ${PALETTE.paper};`);
    expect(light).toContain(`--color-panel: ${PALETTE.panel};`);
    expect(light).toContain(`--color-eggshell: ${PALETTE.eggshell};`);
    expect(light).toContain(`--color-ink: ${PALETTE.ink};`);
    expect(light).toContain(`--color-ink-muted: ${PALETTE.inkMuted};`);
    expect(dark.chosen).toContain(`--color-paper: ${PALETTE.paperDark};`);
  });

  it('darken the tones at night by the same share as the tone rule', () => {
    expect(light).toContain('--tone-shade: 0%;');
    expect(dark.chosen).toContain(`--tone-shade: ${Math.round((1 - NIGHT) * 100)}%;`);
  });

  it('mark what is sound in the color of the adhkar after the prayers', () => {
    const { color } = OCCASIONS.find(({ id }) => id === 'salah')!;
    expect(light).toContain(`--color-sound: color-mix(in oklab, ${color},`);
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

  it.each(blocks)('%s styles only its own block', (block) => {
    const css = read(`components/${block}.css`).replaceAll(/@keyframes[\s\S]*?\n\}/gu, '');
    const names = [...css.matchAll(/\.([a-z][\w-]*)/gu)].map(([, name]) => name!);
    const own = new RegExp(`^${block}(__|--|$)`, 'u');
    expect(names.filter((name) => !own.test(name))).toEqual([]);
  });
});
