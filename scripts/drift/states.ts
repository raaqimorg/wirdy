import type { Page } from 'playwright-core';
import { OCCASION_IDS } from '../../src/lib/occasions.ts';
import { FORMATS } from '../../src/lib/poster.ts';
import { GUIDE_IDS, GUIDES } from '../../src/lib/site.ts';

export type Engine = 'chromium' | 'webkit';

export type Mode = 'light' | 'dark';

export type Viewport = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly touch: boolean;
};

export type State = {
  readonly name: string;
  readonly path: string;
  readonly shot: 'page' | 'screen';
  readonly mouse?: true;
  readonly storage?: Readonly<Record<string, string>>;
  readonly act?: (page: Page) => Promise<void>;
};

export const ENGINES: ReadonlyArray<Engine> = ['chromium', 'webkit'];

export const MODES: ReadonlyArray<Mode> = ['light', 'dark'];

export const VIEWPORTS: ReadonlyArray<Viewport> = [
  { name: '390', width: 390, height: 844, scale: 2, touch: true },
  { name: '820', width: 820, height: 1180, scale: 1, touch: true },
  { name: '1180', width: 1180, height: 820, scale: 1, touch: true },
  { name: '1440', width: 1440, height: 900, scale: 1, touch: false },
];

const DHIKR = '/sabah-masaa/ayat-al-kursi/?w=s';
const HADITH = `${GUIDES.jumuah.path}al-hubwah/`;
const SECTION = '/sabah-masaa/?w=s';
const HISTORY = JSON.stringify({
  version: 1,
  hrefs: ['/sabah-masaa/#ayat-al-kursi', '/nawm/#al-sajdah-wa-al-mulk', '/salah/#tasbih-ashran'],
});

const centre = async (page: Page, selector: string) => {
  await page
    .locator(selector)
    .first()
    .evaluate((element) => {
      element.scrollIntoView({ block: 'center', inline: 'center' });
    });
};

const open = async (page: Page, selector: string) => {
  await page.locator(selector).first().click();
};

const openSearch = async (page: Page) => {
  await open(page, '[data-search-open]');
  await page.locator('[data-search-input]').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => document.querySelectorAll('[data-search-list] [data-search-row]').length > 0
  );
};

const search = (words: string, shown: string) => async (page: Page) => {
  await openSearch(page);
  await page.locator('[data-search-input]').fill(words);
  await page.locator(shown).first().waitFor({ state: 'visible' });
};

const clipboard = (works: boolean) => async (page: Page) => {
  await page.evaluate((resolves) => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => (resolves ? Promise.resolve() : Promise.reject(new Error('denied'))),
      },
    });
  }, works);
  await centre(page, '.dhikr-actions [data-copy]');
  await open(page, '.dhikr-actions [data-copy]');
  await page.locator(`.dhikr-actions [data-copied="${works ? 'yes' : 'failed'}"]`).waitFor();
};

const posterMenu = (format: string, theme: string) => async (page: Page) => {
  await open(page, '[data-sheet-open="posters"]');
  await open(page, `[data-poster-format="${format}"]`);
  await open(page, `[data-poster-theme="${theme}"]`);
};

const saved = async (page: Page) => {
  await posterMenu('story', 'light')(page);
  await page.evaluate(() => {
    const link = document.querySelector('[data-poster-save]');
    if (!(link instanceof HTMLElement)) return;
    const label = link.querySelector('[data-label]');
    if (label !== null) label.textContent = 'تم';
    link.dataset['copied'] = 'yes';
  });
};

const hover = (selector: string) => async (page: Page) => {
  await centre(page, selector);
  await page.locator(selector).first().hover();
};

const focus = (selector: string) => async (page: Page) => {
  await centre(page, selector);
  await page.keyboard.press('Tab');
  await page.locator(selector).first().focus();
};

const press = (selector: string) => async (page: Page) => {
  await centre(page, selector);
  const box = await page.locator(selector).first().boundingBox();
  if (box === null) throw new Error(`${selector} has no box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
};

const TARGETS: ReadonlyArray<{
  readonly name: string;
  readonly path: string;
  readonly selector: string;
}> = [
  { name: 'link-takhrij', path: DHIKR, selector: '.entry a.takhrij' },
  { name: 'link-footer', path: DHIKR, selector: '.site-footer__link' },
  { name: 'button-copy', path: DHIKR, selector: '.dhikr-actions [data-copy]' },
  { name: 'button-wird', path: SECTION, selector: '[data-wird-form="m"]' },
  { name: 'button-theme', path: DHIKR, selector: '[data-theme-toggle]' },
  { name: 'button-search', path: SECTION, selector: '.bar [data-search-open]' },
  { name: 'card-lead', path: '/', selector: '.occasion-card--lead' },
  { name: 'card-row', path: '/', selector: '.occasion-card--row' },
];

const interactions: ReadonlyArray<State> = TARGETS.flatMap(({ name, path, selector }) => [
  { name: `${name}-hover`, path, shot: 'screen', mouse: true, act: hover(selector) },
  { name: `${name}-focus`, path, shot: 'screen', act: focus(selector) },
  { name: `${name}-pressed`, path, shot: 'screen', act: press(selector) },
]);

const posters: ReadonlyArray<State> = FORMATS.flatMap(({ name }) =>
  (name === 'print' ? ['light'] : ['light', 'dark']).map((theme) => ({
    name: `posters-${name}-${theme}`,
    path: SECTION,
    shot: 'screen' as const,
    act: posterMenu(name, theme),
  }))
);

export const STATES: ReadonlyArray<State> = [
  { name: 'home', path: '/', shot: 'page' },
  ...OCCASION_IDS.map((id) => ({
    name: `section-${id}`,
    path: `/${id}/?w=s`,
    shot: 'page' as const,
  })),
  { name: 'section-sabah-masaa-evening', path: '/sabah-masaa/?w=m', shot: 'page' },
  { name: 'dhikr', path: DHIKR, shot: 'page' },
  ...GUIDE_IDS.map((id) => ({ name: `guide-${id}`, path: GUIDES[id].path, shot: 'page' as const })),
  { name: 'hadith', path: HADITH, shot: 'page' },
  { name: 'not-found', path: '/la-yujad/', shot: 'page' },
  { name: 'offline', path: '/bila-ittisal/', shot: 'page' },
  {
    name: 'group-index',
    path: '/salah/',
    shot: 'screen',
    act: (page) => centre(page, '.group-index'),
  },
  { name: 'choices', path: '/salah/', shot: 'screen', act: (page) => centre(page, '.choices') },
  { name: 'phrases', path: '/salah/', shot: 'screen', act: (page) => centre(page, '.phrase') },
  {
    name: 'surah-closed',
    path: '/nawm/',
    shot: 'screen',
    act: (page) => centre(page, '.surah__rest'),
  },
  {
    name: 'surah-open',
    path: '/nawm/',
    shot: 'screen',
    act: async (page) => {
      await open(page, '.surah__more');
      await centre(page, '.surah__more');
    },
  },
  {
    name: 'takhrij-closed',
    path: SECTION,
    shot: 'screen',
    act: (page) => centre(page, '.entry__toggle'),
  },
  {
    name: 'takhrij-open',
    path: SECTION,
    shot: 'screen',
    act: async (page) => {
      await open(page, '.entry__toggle');
      await centre(page, '.entry__toggle');
    },
  },
  {
    name: 'sheet-sections',
    path: SECTION,
    shot: 'screen',
    act: (page) => open(page, '[data-sheet-open="sections"]'),
  },
  { name: 'search-empty', path: '/', shot: 'screen', act: openSearch },
  {
    name: 'search-recent',
    path: '/',
    shot: 'screen',
    storage: { 'search-history': HISTORY },
    act: async (page) => {
      await openSearch(page);
      await page.locator('[data-search-input]').dispatchEvent('input');
      await page.locator('[data-search-recent]').waitFor({ state: 'visible' });
    },
  },
  {
    name: 'search-results',
    path: '/',
    shot: 'screen',
    act: search('الكرسي', '[data-search-list] [data-search-row]:not([hidden])'),
  },
  { name: 'search-none', path: '/', shot: 'screen', act: search('ظظظظ', '[data-search-empty]') },
  { name: 'copy-idle', path: DHIKR, shot: 'screen', act: (page) => centre(page, '.dhikr-actions') },
  { name: 'copy-done', path: DHIKR, shot: 'screen', act: clipboard(true) },
  { name: 'copy-failed', path: DHIKR, shot: 'screen', act: clipboard(false) },
  ...posters,
  { name: 'posters-saved', path: SECTION, shot: 'screen', act: saved },
  ...interactions,
];
