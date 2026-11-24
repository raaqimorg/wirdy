const COUNT = 12;
const RADIUS = 21.5;

export const PETALS = Array.from({ length: COUNT }, (_, index) => {
  const angle = ((-90 + (index * 360) / COUNT) * Math.PI) / 180;
  return {
    cx: (32 + RADIUS * Math.cos(angle)).toFixed(2),
    cy: (32 + RADIUS * Math.sin(angle)).toFixed(2),
  };
});

export function markSvg(): string {
  const petals = PETALS.map(
    ({ cx, cy }) => `<circle cx="${cx}" cy="${cy}" r="6.4" fill="#e0a526"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${petals}<circle cx="32" cy="32" r="12.5" fill="#ad4c0b"/></svg>\n`;
}
