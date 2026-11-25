import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const BROWSERS = [
  process.env.CHROME,
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

type Shot = {
  html: string;
  width: number;
  height: number;
  out: string;
  scale?: number;
  transparent?: boolean;
};

export function screenshot({ html, width, height, out, scale = 1, transparent = false }: Shot) {
  const browser = BROWSERS.find((path) => path && existsSync(path));
  if (!browser) {
    console.error('no chromium-based browser found; set CHROME to one');
    process.exit(1);
  }
  const page = join(mkdtempSync(join(tmpdir(), 'wirdy-')), 'page.html');
  writeFileSync(page, html);
  execFileSync(browser, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--screenshot=${out}`,
    pathToFileURL(page).href,
  ]);
  return out;
}
