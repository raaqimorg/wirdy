import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OCCASIONS } from '../lib/occasions';
import { PALETTE } from '../lib/palette';

const STYLES = join(process.cwd(), 'src/styles');
const COMPONENTS = join(process.cwd(), 'src/components');

const read = (file: string) => readFileSync(join(STYLES, file), 'utf8');
const pascal = (name: string) =>
  name.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());

const blocks = readdirSync(join(STYLES, 'components')).map((file) => file.replace('.css', ''));
const sheets = ['tokens.css', 'base.css', 'utilities.css', 'fonts.css'];
const everything = [...sheets, ...blocks.map((block) => `components/${block}.css`)].map(read);
const all = everything.join('\n');
const tokens = read('tokens.css');

const declarations = (block: string) =>
  [...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map(([, name, value]) => `${name}: ${value}`);
const dark = {
  device: tokens.match(/:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/)![1]!,
  chosen: tokens.match(/:root\[data-theme="dark"\] \{([^}]*)\}/)![1]!,
};
const light = tokens.match(/^:root \{([\s\S]*?)^\}/m)![1]!;

describe('the tokens', () => {
  it('are all defined', () => {
    const used = new Set([...all.matchAll(/var\((--[\w-]+)/g)].map(([, name]) => name!));
    const defined = new Set([...all.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name!));
    const inline = new Set(['--stage', '--tone']);
    expect([...used].filter((name) => !defined.has(name) && !inline.has(name))).toEqual([]);
  });

  it('are all used', () => {
    const defined = [...all.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name!);
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
    expect(light).toContain(`--color-eggshell: ${PALETTE.eggshell};`);
    expect(light).toContain(`--color-ink: ${PALETTE.ink};`);
    expect(light).toContain(`--color-ink-muted: ${PALETTE.inkMuted};`);
    expect(dark.chosen).toContain(`--color-paper: ${PALETTE.paperDark};`);
  });

  it('mark what is sound in the color of the adhkar after the prayers', () => {
    const { color } = OCCASIONS.find(({ id }) => id === 'salah')!;
    expect(light).toContain(`--color-sound: color-mix(in oklab, ${color},`);
  });
});

describe('the component styles', () => {
  it('are each imported once', () => {
    const imports = [...read('index.css').matchAll(/"\.\/components\/([\w-]+)\.css"/g)];
    expect(imports.map(([, name]) => name!).toSorted()).toEqual(blocks.toSorted());
  });

  it.each(blocks)('%s belongs to a component of the same name', (block) => {
    expect(existsSync(join(COMPONENTS, `${pascal(block)}.astro`))).toBe(true);
  });

  it.each(blocks)('%s styles only its own block', (block) => {
    const css = read(`components/${block}.css`).replace(/@keyframes[\s\S]*?\n\}/g, '');
    const names = [...css.matchAll(/\.([a-z][\w-]*)/g)].map(([, name]) => name!);
    const own = new RegExp(`^${block}(__|--|$)`);
    expect(names.filter((name) => !own.test(name))).toEqual([]);
  });
});
