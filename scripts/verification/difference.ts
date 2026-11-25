import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalize, spanOf } from '../../src/lib/matching.ts';
import { proofSchema, type Proof } from '../../src/lib/proof.ts';
import { RECORDS } from '../../src/lib/records.ts';

const [id, site, phrase, reason, at, words] = process.argv.slice(2);

if (!words) {
  console.error(
    'usage: bun run verification:difference <id> <site> "<phrase>" <reason> <source> "<words in the source>"'
  );
  process.exit(1);
}

const path = join(RECORDS, `${id}.json`);
const proof: Proof = JSON.parse(readFileSync(path, 'utf8'));
const source = Number(at);
const page = proof.sources[source];
const text = page?.state === 'present' ? spanOf(page.text, words) : undefined;
if (text === undefined) {
  console.error(`source ${source} does not have these words`);
  process.exit(1);
}

const kept = proof.differences.filter(
  (other) => other.site !== site || normalize(other.phrase) !== normalize(phrase)
);
const differences = [...kept, { site, phrase, reason, shown: { source, text } }];

writeFileSync(path, `${JSON.stringify(proofSchema.parse({ ...proof, differences }), null, 2)}\n`);
console.log(`${id}: ${site} differs at «${phrase}»`);
