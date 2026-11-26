const MANIFEST = self.MANIFEST;
const PAGES = 'pages';
const FILES = 'files';
const files = new Set([...MANIFEST.files, MANIFEST.hashes]);
let hashing;

async function keep(cache, key, request) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic' && !response.redirected)
    await cache.put(key, response.clone());
  return response;
}

async function served(name, key, request) {
  const cache = await caches.open(name);
  const hit = await cache.match(key);
  return hit ?? keep(cache, key, request);
}

async function readHashes() {
  const response = await served(FILES, MANIFEST.hashes, new Request(MANIFEST.hashes));
  if (!response.ok) throw new Error(`${MANIFEST.hashes} answered ${response.status}`);
  return response.json();
}

function forget(error) {
  hashing = undefined;
  throw error;
}

function hashesOf() {
  hashing ??= readHashes().catch(forget);
  return hashing;
}

function keyOf(hashes, path) {
  return `${path}?v=${hashes[path]}`;
}

async function prefetch() {
  const hashes = await hashesOf();
  if (self.navigator.connection?.saveData) return;
  const pages = await caches.open(PAGES);
  const assets = await caches.open(FILES);
  await Promise.allSettled(
    MANIFEST.prefetch.map(async (path) => {
      const page = Object.hasOwn(hashes, path);
      const cache = page ? pages : assets;
      const key = page ? keyOf(hashes, path) : path;
      if (await cache.match(key)) return;
      await keep(cache, key, new Request(path, { cache: page ? 'no-cache' : 'default' }));
    })
  );
}

function isCurrent(hashes, request) {
  const { pathname, search } = new URL(request.url);
  return Object.hasOwn(hashes, pathname) && search === `?v=${hashes[pathname]}`;
}

async function prune() {
  const hashes = await hashesOf();
  const pages = await caches.open(PAGES);
  const assets = await caches.open(FILES);
  const stale = [
    ...(await pages.keys())
      .filter((request) => !isCurrent(hashes, request))
      .map((request) => pages.delete(request)),
    ...(await assets.keys())
      .filter((request) => !files.has(new URL(request.url).pathname))
      .map((request) => assets.delete(request)),
    ...(await caches.keys())
      .filter((name) => name !== PAGES && name !== FILES)
      .map((name) => caches.delete(name)),
  ];
  await Promise.all(stale);
}

async function navigated(request, path) {
  const hashes = await hashesOf().catch(() => ({}));
  if (!Object.hasOwn(hashes, path)) return fetch(request);
  return served(PAGES, keyOf(hashes, path), request);
}

self.addEventListener('install', (event) => {
  event.waitUntil(prefetch().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(prune().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(navigated(request, url.pathname));
  else if (files.has(url.pathname)) event.respondWith(served(FILES, url.pathname, request));
});
