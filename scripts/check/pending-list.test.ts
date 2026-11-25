import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const GUARD = join(import.meta.dir, 'pending-list.mjs');
const LIST = 'verification/pending.json';

const roots: string[] = [];
let work = '';

function isolatedEnv(): Record<string, string | undefined> {
  const inherited = Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'));
  return {
    ...Object.fromEntries(inherited),
    GIT_AUTHOR_NAME: 'test',
    GIT_AUTHOR_EMAIL: 'test@example.test',
    GIT_COMMITTER_NAME: 'test',
    GIT_COMMITTER_EMAIL: 'test@example.test',
  };
}

function git(...args: string[]): void {
  const result = Bun.spawnSync(['git', ...args], { cwd: work, env: isolatedEnv() });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr.toString()}`);
}

function stage(list: Record<string, string>): void {
  mkdirSync(join(work, 'verification'), { recursive: true });
  writeFileSync(join(work, LIST), JSON.stringify(list));
  git('add', LIST);
}

function guard(): number {
  return Bun.spawnSync(['bun', GUARD], { cwd: work, env: isolatedEnv() }).exitCode;
}

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), 'pending-list-'));
  roots.push(work);
  git('init', '-q', '-b', 'main');
  git('commit', '--allow-empty', '-q', '-m', 'base');
});

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

describe('the pending list', () => {
  test('may start when main has none', () => {
    git('switch', '-q', '-c', 'work');
    stage({ 'nawm/a': '1', 'nawm/b': '2' });
    expect(guard()).toBe(0);
  });

  test('needs no check when there is no list', () => {
    expect(guard()).toBe(0);
  });

  test('may shrink, or stay as it is', () => {
    stage({ 'nawm/a': '1', 'nawm/b': '2' });
    git('commit', '-q', '-m', 'list');
    git('switch', '-q', '-c', 'work');
    expect(guard()).toBe(0);
    stage({ 'nawm/a': '1' });
    expect(guard()).toBe(0);
  });

  test('may not take a new entry', () => {
    stage({ 'nawm/a': '1' });
    git('commit', '-q', '-m', 'list');
    git('switch', '-q', '-c', 'work');
    stage({ 'nawm/a': '1', 'nawm/c': '3' });
    expect(guard()).toBe(1);
  });

  test('may not take a new fingerprint for an entry', () => {
    stage({ 'nawm/a': '1' });
    git('commit', '-q', '-m', 'list');
    git('switch', '-q', '-c', 'work');
    stage({ 'nawm/a': '9' });
    expect(guard()).toBe(1);
  });
});
