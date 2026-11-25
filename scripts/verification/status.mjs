import { readAdhkar, readPending, readProofs } from '../../src/lib/records.ts';
import { baselineProblems } from '../../src/lib/baseline.ts';
import { statusOf } from '../../src/lib/verification.ts';

const [only] = process.argv.slice(2);
const entries = readAdhkar();
const proofs = readProofs();
const pending = readPending();

const states = entries.map(({ id, data, body }) => ({
  id,
  ...statusOf(data, body, proofs[id]),
}));

if (only) {
  const found = states.find(({ id }) => id === only);
  if (!found) {
    console.error(`no dhikr has the id ${only}`);
    process.exit(1);
  }
  console.log([`${only}: ${found.state}`, ...found.problems].join('\n  '));
} else {
  const count = (state) => states.filter((dhikr) => dhikr.state === state).length;
  console.log(
    `${count('proven')} proven, ${count('changed')} changed, ${count('unproven')} unproven, ${Object.keys(pending).length} pending`
  );
  for (const { id, state, problems } of states) {
    if (state !== 'proven') console.log(`${id}: ${state} (${problems.join('; ')})`);
  }
  const broken = baselineProblems(entries, proofs, pending);
  if (broken.length > 0) {
    console.error(broken.join('\n'));
    process.exit(1);
  }
}
