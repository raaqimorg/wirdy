import type { Dhikr } from './schema';

type Takhrij = Dhikr['takhrij'];

const VERB: Record<string, string> = { صحيح: 'صحّح', حسن: 'حسّن', ضعيف: 'ضعّف' };
const NUMBERED = /^(.+) ([٠-٩]+(?:\/[٠-٩]+)?)$/;
const EXCEPT = /^(صحيح|حسن) دون (قوله|زيادة): (.+)$/;

function cite(source: string): string {
  const match = source.match(NUMBERED);
  return match ? `${match[1]} (${match[2]})` : source;
}

export function takhrijLine({ grader, source, ruling }: Takhrij): string {
  const where = cite(source);
  if (grader !== 'الألباني') return where;

  const verb = VERB[ruling];
  if (verb) return `${verb}ه الألباني في ${where}`;

  const except = ruling.match(EXCEPT);
  if (except && source.startsWith('ضعيف')) {
    return `${VERB[except[1]!]} الألباني الحديث دون ${except[2]} «${except[3]}» (${source})`;
  }
  if (except) return `${VERB[except[1]!]}ه الألباني في ${where} دون ${except[2]} «${except[3]}»`;

  return `قال الألباني في ${where}: ${ruling}`;
}
