import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { proofSchema } from '../../src/lib/proof.ts';
import { RECORDS } from '../../src/lib/records.ts';

const [id, site, ...searches] = process.argv.slice(2);

if (searches.length < 2) {
  console.error('usage: bun run verification:absent <id> <hdith or sunnah> "<search>" "<search>"');
  process.exit(1);
}

const path = join(RECORDS, `${id}.json`);
const proof = JSON.parse(readFileSync(path, 'utf8'));
const date = new Date().toISOString().slice(0, 10);
const absent = { state: 'absent', site, date, searches };
const held = proof.sources.findIndex((source) => source.site === site);
if (held !== -1 && proof.sources[held].state === 'present') {
  console.error(`${id} has a page of ${site}`);
  process.exit(1);
}
proof.sources[held === -1 ? proof.sources.length : held] = absent;

writeFileSync(path, `${JSON.stringify(proofSchema.parse(proof), null, 2)}\n`);
console.log(`${id}: ${site} does not have it`);
