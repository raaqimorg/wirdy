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

const button = document.createElement('button');
button.style.cssText =
  'position:fixed;inset-block-start:0;left:0;width:200px;height:100px;z-index:2147483647;background:yellow';
button.textContent = 'wirdy: reading';
button.addEventListener('click', () => {
  document.addEventListener(
    'copy',
    (event) => {
      event.preventDefault();
      event.clipboardData.setData('text/plain', JSON.stringify(captures));
    },
    { once: true }
  );
  document.execCommand('copy');
});
document.body.append(button);

async function read() {
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
        title: path.startsWith('/urn/')
          ? page.querySelector('.crumbs').textContent.replaceAll(/\s+/g, ' ').trim()
          : page.title,
        text: block.textContent,
      });
    } else {
      failures.push({ path, status: 'no hadith block' });
    }
    await new Promise((resolve) => setTimeout(resolve, PAUSE));
  }
  button.textContent = `wirdy: ${captures.length}`;
}

read();
