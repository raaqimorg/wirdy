import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprintOf } from '../../src/lib/fingerprint.ts';
import { spanOf, spansOf } from '../../src/lib/matching.ts';
import { proofSchema } from '../../src/lib/proof.ts';
import { readAdhkar, RECORDS } from '../../src/lib/records.ts';
import { formOf } from '../../src/lib/variants.ts';

const [id, claim, at, words] = process.argv.slice(2);
const dhikr = readAdhkar().find((entry) => entry.id === id);

if (!dhikr || !claim || (claim !== 'takhrij' && claim !== 'text' && !words)) {
  console.error('usage: bun run verification:claim <id> <claim> <source> "<words in the source>"');
  process.exit(1);
}

const path = join(RECORDS, `${id}.json`);
const proof = JSON.parse(readFileSync(path, 'utf8'));
const { data, body } = dhikr;

function cut(source) {
  const { text } = proof.sources[source];
  if (words) return [spanOf(text, words)];
  const forms = new Set([formOf(body.trim(), 'sabah'), formOf(body.trim(), 'masaa')]);
  return [...forms].flatMap((form) => spansOf(text, form));
}

const source = Number(at);
const cuts = claim === 'takhrij' ? [] : cut(source);
if (cuts.includes(undefined)) {
  console.error(`source ${source} does not have these words`);
  process.exit(1);
}

const kept = (proof.claims[claim]?.spans ?? []).filter(
  (span) => !(span.source === source && cuts.includes(span.text))
);
proof.claims[claim] = {
  fingerprint: fingerprintOf(claim, data, body),
  spans: [...kept, ...cuts.map((text) => ({ source, text }))],
};

writeFileSync(path, `${JSON.stringify(proofSchema.parse(proof), null, 2)}\n`);
console.log(`${id}: ${claim} has ${proof.claims[claim].spans.length} spans`);
