import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const split = tokens.indexOf('@media');
const light = tokens.slice(0, split);
const dark = tokens.slice(split);

function token(source: string, name: string): string {
  const found = new RegExp(`--${name}: ([^;]+);`, 'u').exec(source);
  return found?.[1] ?? '';
}

export const PALETTE = {
  paper: token(light, 'color-paper'),
  paperDark: token(dark, 'color-paper'),
  panel: token(light, 'color-panel'),
  eggshell: token(light, 'color-eggshell'),
  ink: token(light, 'color-ink'),
  inkMuted: token(light, 'color-ink-muted'),
  inkFaint: token(light, 'color-ink-faint'),
  shade: '#000',
  petal: '#d2a249',
  disc: '#91593c',
} as const;
