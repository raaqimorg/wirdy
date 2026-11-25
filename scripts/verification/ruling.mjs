import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sourceOf } from '../../src/lib/capture.ts';
import { proofSchema } from '../../src/lib/proof.ts';
import { RECORDS } from '../../src/lib/records.ts';

const [id, from, url] = process.argv.slice(2);

if (!url) {
  console.error('usage: bun run verification:ruling <id> <file> <dorar.net url in the file>');
  process.exit(1);
}

const path = join(RECORDS, `${id}.json`);
const proof = JSON.parse(readFileSync(path, 'utf8'));
const capture = [JSON.parse(readFileSync(from, 'utf8'))].flat().find((page) => page.url === url);
if (!capture) throw new Error(`no capture of ${url}`);
const { grader, book, number, ruling } = sourceOf(capture);
proof.rulings = [
  ...proof.rulings.filter((other) => other.url !== url),
  { grader, book, number, ruling, url },
];

writeFileSync(path, `${JSON.stringify(proofSchema.parse(proof), null, 2)}\n`);
console.log(`${id}: ${grader}, ${book} ${number}: ${ruling}`);
