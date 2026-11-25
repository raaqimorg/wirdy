import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { captureOfMarkdown, sourceOf } from '../../src/lib/capture.ts';
import { proofSchema } from '../../src/lib/proof.ts';
import { readAdhkar, RECORDS } from '../../src/lib/records.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { number: { type: 'string' } },
});
const [id, from, url] = positionals;

if (!id || !from || !readAdhkar().some((dhikr) => dhikr.id === id)) {
  console.error(
    'usage: bun run verification:import <id> <file or hdith.com url> [url in the file]'
  );
  process.exit(1);
}

async function readCapture() {
  if (from.startsWith('https://hdith.com/')) {
    const response = await fetch(`${from.replace(/\.md$/, '')}.md`);
    if (!response.ok) throw new Error(`${from} answered ${response.status}`);
    return captureOfMarkdown(await response.text(), new Date().toISOString().slice(0, 10));
  }
  const captures = [JSON.parse(readFileSync(from, 'utf8'))].flat();
  const found = url ? captures.filter((capture) => capture.url === url) : captures;
  if (found.length !== 1) throw new Error(`${found.length} captures match; name one url`);
  return found[0];
}

const path = join(RECORDS, `${id}.json`);
const proof = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : { sources: [], claims: {}, differences: [], rulings: [] };

const source = sourceOf(await readCapture(), values.number);
const held = proof.sources.findIndex((other) => other.url === source.url);
const index = held === -1 ? proof.sources.length : held;
proof.sources[index] = source;

mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, `${JSON.stringify(proofSchema.parse(proof), null, 2)}\n`);
console.log(`${id}: source ${index} is ${source.site}, ${source.book} ${source.number}`);
