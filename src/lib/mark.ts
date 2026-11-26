import { createHash } from 'node:crypto';
import { PALETTE } from './palette';
import { ringPoints } from './ring';

export const PETALS = ringPoints(12, 32, 21.5);

export function markSvg(inks: 'own' | 'stage' = 'own'): string {
  const stage = inks === 'stage';
  const petals = PETALS.map(
    ({ cx, cy }) =>
      `<circle cx="${cx}" cy="${cy}" r="6.4" fill="${stage ? PALETTE.eggshell : PALETTE.petal}"/>`
  ).join('');
  const disc = stage
    ? `<circle cx="32" cy="32" r="12.5" fill="${PALETTE.shade}" fill-opacity="0.24"/>`
    : `<circle cx="32" cy="32" r="12.5" fill="${PALETTE.disc}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${petals}${disc}</svg>\n`;
}

export const ICON_VERSION = createHash('sha256')
  .update(JSON.stringify([markSvg(), PALETTE.eggshell]))
  .digest('hex')
  .slice(0, 8);
