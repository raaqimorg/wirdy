import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { manifestOf, serviceWorkerOf, type Built } from '../lib/offline';

const ORIGIN = 'https://wirdy.site';
const TEMPLATE = readFileSync('src/scripts/service-worker.js', 'utf8');

type Key = string | { readonly url: string };
type Handler = (event: unknown) => void;
type Answer = (path: string, init: RequestInit | undefined) => string | null;

const absolute = (key: Key) => new URL(typeof key === 'string' ? key : key.url, ORIGIN).href;

class SiteRequest extends Request {
  constructor(input: string, init?: RequestInit) {
    super(absolute(input), init);
  }
}

const bytes = (text: string) => new TextEncoder().encode(text);
const basic = (body: string, status = 200) =>
  Object.defineProperty(new Response(body, { status }), 'type', { value: 'basic' });
const none: Answer = () => null;

const card = (href: string) => `<a class="occasion-card occasion-card--featured" href="${href}">`;
const site = (ayat: string): Built => ({
  pages: [
    ['index.html', bytes(card('/nawm/'))],
    ['nawm/index.html', bytes('nawm')],
    ['nawm/ayat-al-kursi/index.html', bytes(ayat)],
    ['bila-ittisal/index.html', bytes('offline')],
    ['search/index.json', bytes('[]')],
  ],
  files: ['_astro/site.abcdefgh.css'],
});

function cacheStorage() {
  const stores = new Map<string, Map<string, Response>>();
  const storeOf = (name: string) => {
    const store = stores.get(name) ?? new Map<string, Response>();
    stores.set(name, store);
    return {
      match: (key: Key) => Promise.resolve(store.get(absolute(key))?.clone()),
      put: (key: Key, response: Response) => {
        store.set(absolute(key), response);
        return Promise.resolve();
      },
      keys: () => Promise.resolve([...store.keys()].map((url) => ({ url }))),
      delete: (key: Key) => Promise.resolve(store.delete(absolute(key))),
    };
  };
  const api = {
    open: (name: string) => Promise.resolve(storeOf(name)),
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name: string) => Promise.resolve(stores.delete(name)),
    match: (key: Key, { cacheName }: { cacheName: string }) => storeOf(cacheName).match(key),
  };
  return { stores, api };
}

function worker(built: Built, answer: Answer) {
  const { file, hashes, worker: code } = serviceWorkerOf(manifestOf(built), TEMPLATE);
  const files = new Map(built.pages.map(([name, body]) => [name, new TextDecoder().decode(body)]));
  const served = (path: string) =>
    path === `/${file}`
      ? hashes
      : (files.get(
          path === '/' ? 'index.html' : `${path.slice(1)}${path.endsWith('/') ? 'index.html' : ''}`
        ) ?? null);
  const requested: string[] = [];
  let online = true;
  const fetch = (input: Key, init?: RequestInit) => {
    const path = new URL(absolute(input)).pathname;
    requested.push(path);
    if (!online) return Promise.reject(new TypeError('Failed to fetch'));
    const body = answer(path, init) ?? served(path);
    return Promise.resolve(body === null ? basic('', 404) : basic(body));
  };
  const { stores, api } = cacheStorage();
  const listeners = new Map<string, Handler>();
  const self = {
    location: new URL(`${ORIGIN}/service-worker.js`),
    navigator: {},
    addEventListener: (type: string, listener: Handler) => listeners.set(type, listener),
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
  };
  runInContext(
    code,
    createContext({
      self,
      caches: api,
      fetch,
      crypto,
      URL,
      Request: SiteRequest,
      Response,
      Uint8Array,
    })
  );
  const pending: Promise<unknown>[] = [];
  const settle = async (): Promise<void> => {
    if (pending.length === 0) return;
    await Promise.allSettled(pending.splice(0));
    await settle();
  };
  const install = async () => {
    listeners.get('install')?.({ waitUntil: (work: Promise<unknown>) => pending.push(work) });
    await settle();
  };
  const request = async (path: string, mode = 'navigate') => {
    let answered: Promise<Response> | undefined;
    listeners.get('fetch')?.({
      request: { method: 'GET', url: `${ORIGIN}${path}`, mode },
      respondWith: (response: Promise<Response>) => {
        answered = response;
      },
      waitUntil: (work: Promise<unknown>) => pending.push(work),
    });
    const response = await answered;
    await settle();
    return response?.text();
  };
  const keptText = (path: string) => {
    const store = stores.get('kept') ?? new Map<string, Response>();
    const entries = [...store.entries()].filter(([url]) => new URL(url).pathname === path);
    return Promise.all(entries.map(([, response]) => response.clone().text()));
  };
  return {
    install,
    request,
    keptText,
    requested,
    offline: () => {
      online = false;
    },
  };
}

const AYAT = '/nawm/ayat-al-kursi/';

describe('the service worker', () => {
  it('shows an old page the browser cache gives, but keeps only the page of its fingerprint', async () => {
    const sw = worker(site('new'), (path, init) =>
      path === AYAT && init?.cache !== 'no-cache' ? 'old' : null
    );
    expect(await sw.request(AYAT)).toBe('old');
    expect(await sw.keptText(AYAT)).toEqual(['new']);
    sw.requested.length = 0;
    expect(await sw.request(AYAT)).toBe('new');
    expect(sw.requested).not.toContain(AYAT);
  });

  it('never keeps a page whose bytes differ from its fingerprint', async () => {
    const sw = worker(site('new'), (path) => (path === AYAT ? 'old' : null));
    expect(await sw.request(AYAT)).toBe('old');
    expect(await sw.keptText(AYAT)).toEqual([]);
  });

  it('keeps the search index by its fingerprint, and serves it with no request', async () => {
    const sw = worker(site('new'), none);
    await sw.install();
    sw.requested.length = 0;
    expect(await sw.request('/search/index.json', 'cors')).toBe('[]');
    expect(sw.requested).toEqual([]);
  });

  it('opens a kept page offline, and the offline page for any other', async () => {
    const sw = worker(site('new'), none);
    await sw.install();
    sw.offline();
    expect(await sw.request('/nawm/')).toBe('nawm');
    expect(await sw.request(AYAT)).toBe('offline');
  });
});
