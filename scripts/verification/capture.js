/* oxlint-disable no-await-in-loop -- one page at a time, so a site is never flooded */
const PATHS = [];
const PAUSE = 3000;

const SITES = {
  'dorar.net': {
    site: 'dorar',
    blockOf: (page) =>
      [...page.querySelectorAll('div.d-block')].find((part) =>
        part.textContent.includes('خلاصة حكم المحدث')
      )?.parentElement,
  },
  'shamela.ws': { site: 'shamela', blockOf: (page) => page.querySelector('.nass') },
  'sunnah.com': { site: 'sunnah', blockOf: (page) => page.querySelector('.arabic_hadith_full') },
};

const { site, blockOf } = SITES[location.hostname];
const captures = [];
const failures = [];

for (const path of PATHS) {
  const response = await fetch(path);
  if (!response.ok) {
    failures.push({ path, status: response.status });
    break;
  }
  const page = new DOMParser().parseFromString(await response.text(), 'text/html');
  const block = blockOf(page);
  if (block) {
    for (const part of block.querySelectorAll('script, style')) part.remove();
    captures.push({
      site,
      url: new URL(path, location.origin).href,
      capturedAt: new Date().toISOString().slice(0, 10),
      title: page.title,
      text: block.textContent,
    });
  } else {
    failures.push({ path, status: 'no hadith block' });
  }
  await new Promise((resolve) => setTimeout(resolve, PAUSE));
}

const link = document.createElement('a');
link.href = URL.createObjectURL(
  new Blob([JSON.stringify(captures, null, 2)], { type: 'application/json' })
);
link.download = `wirdy-captures-${site}.json`;
link.textContent = `wirdy: ${captures.length}`;
link.style.cssText =
  'position:fixed;inset-block-start:0;left:0;width:200px;height:100px;z-index:2147483647;background:yellow';
document.body.append(link);

JSON.stringify({ site, captured: captures.length, failures });
