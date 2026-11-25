import { spawnSync } from 'node:child_process';

const LIST = 'verification/pending.json';

function listAt(revision) {
  const result = spawnSync('git', ['show', `${revision}:${LIST}`], { encoding: 'utf8' });
  return result.status === 0 ? JSON.parse(result.stdout) : undefined;
}

const allowed = listAt('main');
const staged = listAt('');

if (allowed && staged) {
  const added = Object.keys(staged).filter((id) => staged[id] !== allowed[id]);
  for (const id of added) console.error(`[pending-list] ${id} is not in the list of main`);
  if (added.length > 0) process.exit(1);
}
