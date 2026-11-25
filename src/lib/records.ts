import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Entry } from './baseline';
import { slugOf } from './permalink';
import { proofSchema, type Proof } from './proof';
import { dhikrSchema } from './schema';

const ADHKAR = join(process.cwd(), 'src/content/adhkar');

export const RECORDS = join(process.cwd(), 'verification');
export const PENDING = join(RECORDS, 'pending.json');

function filesUnder(folder: string, extension: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith(extension))
    .toSorted();
}

export function readAdhkar(): Entry[] {
  return filesUnder(ADHKAR, '.md').map((path) => {
    const file = matter(readFileSync(join(ADHKAR, path), 'utf8'));
    const data = dhikrSchema.parse(file.data);
    return { id: `${data.occasion}/${slugOf(path.slice(0, -3))}`, data, body: file.content };
  });
}

export function readProofs(): Record<string, Proof> {
  return Object.fromEntries(
    filesUnder(RECORDS, '.json')
      .filter((path) => path !== 'pending.json')
      .map((path) => [
        path.slice(0, -5),
        proofSchema.parse(JSON.parse(readFileSync(join(RECORDS, path), 'utf8'))),
      ])
  );
}

export function readPending(): Record<string, string> {
  return existsSync(PENDING) ? JSON.parse(readFileSync(PENDING, 'utf8')) : {};
}
