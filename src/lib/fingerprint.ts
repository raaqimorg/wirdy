import { createHash } from 'node:crypto';
import type { Dhikr } from './schema';

export type Claim = 'text' | 'count' | 'moment' | 'manner' | 'fadl' | 'takhrij';

type Verifiable = Dhikr & { context?: string };

const CLAIMS: Claim[] = ['text', 'count', 'moment', 'manner', 'fadl', 'takhrij'];

const provenBy: Record<Claim, (data: Verifiable, body: string) => object> = {
  text: ({ quran }, body) => ({ body: body.normalize('NFC').trim(), quran }),
  count: ({ count, counts }) => ({ count, counts }),
  moment: ({ occasion, mode, when, context }) => ({ occasion, mode, when, context }),
  manner: ({ how }) => ({ how }),
  fadl: ({ fadl }) => ({ fadl }),
  takhrij: ({ takhrij: { grader, source, ruling, url } }) => ({ grader, source, ruling, url }),
};

function hash(value: object): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

export function fingerprintOf(claim: Claim, data: Verifiable, body: string): string {
  return hash(provenBy[claim](data, body));
}

export function wholeFingerprint(data: Verifiable, body: string): string {
  return hash(CLAIMS.map((claim) => fingerprintOf(claim, data, body)));
}

export function claimsOf({
  count,
  counts,
  occasion,
  when,
  context,
  how,
  fadl,
}: Verifiable): Claim[] {
  const made: Record<Claim, boolean> = {
    text: true,
    count: count > 1 || counts !== undefined,
    moment: occasion !== 'mutlaq' || when !== undefined || context !== undefined,
    manner: how !== undefined,
    fadl: fadl !== undefined,
    takhrij: true,
  };
  return CLAIMS.filter((claim) => made[claim]);
}
