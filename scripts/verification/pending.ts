import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { wholeFingerprint } from '../../src/lib/fingerprint.ts';
import { PENDING, readAdhkar, RECORDS } from '../../src/lib/records.ts';

if (existsSync(PENDING)) {
  console.error('verification/pending.json exists, and it only shrinks');
  process.exit(1);
}

const entries = readAdhkar()
  .map(({ id, data, body }) => [id, wholeFingerprint(data, body)] as const)
  .toSorted(([a], [b]) => (a < b ? -1 : 1));

mkdirSync(RECORDS, { recursive: true });
writeFileSync(PENDING, `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`);
console.log(`${entries.length} pending`);
