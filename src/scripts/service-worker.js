const MANIFEST = self.MANIFEST;
const KEPT = 'kept';
const FILES = 'files';
const files = new Set([...MANIFEST.files, MANIFEST.hashes]);
const fetching = new Map();
let hashing;

function storable(response) {
  return response.ok && response.type === 'basic' && !response.redirected;
}

async function keep(cache, key, request) {
  const response = await fetch(request);
  if (storable(response)) await cache.put(key, response.clone());
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

async function fingerprintOf(response) {
  const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  return [...new Uint8Array(digest, 0, 8)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function store(cache, hashes, path, response) {
  if (!storable(response)) return false;
  if ((await fingerprintOf(response)) !== hashes[path]) return false;
  await cache.put(keyOf(hashes, path), response.clone());
  return true;
}

async function refresh(cache, hashes, path) {
  const response = await fetch(path, { cache: 'no-cache' });
  await store(cache, hashes, path, response);
  return response;
}

function warming(cache, hashes, path) {
  const key = keyOf(hashes, path);
  if (!fetching.has(key))
    fetching.set(
      key,
      refresh(cache, hashes, path).finally(() => {
        fetching.delete(key);
      })
    );
  return fetching.get(key);
}

async function warm(path) {
  const hashes = await hashesOf();
  if (!Object.hasOwn(hashes, path) || self.navigator.connection?.saveData) return;
  const cache = await caches.open(KEPT);
  if (await cache.match(keyOf(hashes, path))) return;
  await warming(cache, hashes, path);
}

async function kept(hashes, path, request, later) {
  const cache = await caches.open(KEPT);
  const key = keyOf(hashes, path);
  const hit = await cache.match(key);
  if (hit) return hit;
  if (fetching.has(key)) {
    await fetching.get(key).catch(() => null);
    const warmed = await cache.match(key);
    if (warmed) return warmed;
  }
  const response = await fetch(request);
  if (!(await store(cache, hashes, path, response)) && response.ok)
    later(refresh(cache, hashes, path).catch(() => null));
  return response;
}

async function prefetch() {
  const hashes = await hashesOf();
  if (self.navigator.connection?.saveData) return;
  const pages = await caches.open(KEPT);
  const assets = await caches.open(FILES);
  await Promise.allSettled(
    MANIFEST.prefetch.map(async (path) => {
      if (!Object.hasOwn(hashes, path)) {
        if (await assets.match(path)) return;
        await keep(assets, path, new Request(path));
        return;
      }
      if (await pages.match(keyOf(hashes, path))) return;
      await refresh(pages, hashes, path);
    })
  );
}

function isCurrent(hashes, request) {
  const { pathname, search } = new URL(request.url);
  return Object.hasOwn(hashes, pathname) && search === `?v=${hashes[pathname]}`;
}

async function prune() {
  const hashes = await hashesOf();
  const pages = await caches.open(KEPT);
  const assets = await caches.open(FILES);
  const stale = [
    ...(await pages.keys())
      .filter((request) => !isCurrent(hashes, request))
      .map((request) => pages.delete(request)),
    ...(await assets.keys())
      .filter((request) => !files.has(new URL(request.url).pathname))
      .map((request) => assets.delete(request)),
    ...(await caches.keys())
      .filter((name) => name !== KEPT && name !== FILES)
      .map((name) => caches.delete(name)),
  ];
  await Promise.all(stale);
}

async function offline(hashes, error) {
  if (!Object.hasOwn(hashes, MANIFEST.offline)) throw error;
  const page = await caches.match(keyOf(hashes, MANIFEST.offline), { cacheName: KEPT });
  if (!page) throw error;
  return page;
}

async function navigated(request, path, later) {
  const hashes = await hashesOf().catch(() => ({}));
  const known = Object.hasOwn(hashes, path);
  try {
    return await (known ? kept(hashes, path, request, later) : fetch(request));
  } catch (error) {
    return offline(hashes, error);
  }
}

async function index(request, later) {
  const hashes = await hashesOf().catch(() => ({}));
  if (!Object.hasOwn(hashes, MANIFEST.index)) return fetch(request);
  return kept(hashes, MANIFEST.index, request, later);
}

self.addEventListener('install', (event) => {
  event.waitUntil(prefetch().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(prune().then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  const path = event.data?.keep;
  if (typeof path === 'string') event.waitUntil(warm(path).catch(() => null));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const later = (work) => event.waitUntil(work);
  if (request.mode === 'navigate') event.respondWith(navigated(request, url.pathname, later));
  else if (url.pathname === MANIFEST.index) event.respondWith(index(request, later));
  else if (files.has(url.pathname)) event.respondWith(served(FILES, url.pathname, request));
});
