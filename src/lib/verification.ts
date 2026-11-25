import { claimsOf, fingerprintOf, type Claim } from './fingerprint';
import { missingPhrases, normalize, phrasesIn } from './matching';
import type { Present, Proof, Span } from './proof';
import type { Dhikr } from './schema';
import { formOf } from './variants';

export type Status = { state: 'proven' | 'changed' | 'unproven'; problems: string[] };

type Site = Present['site'];

const COVERED_BOOKS = [
  'صحيح البخاري',
  'صحيح مسلم',
  'صحيح أبي داود',
  'صحيح الترمذي',
  'صحيح النسائي',
  'صحيح ابن ماجه',
  'صحيح الأدب المفرد',
];

const IN_THE_CITED_PAGE = new Set<Claim>(['count', 'moment', 'fadl']);

const SAHIHAYN = new Set(['البخاري', 'مسلم']);

const CHANGED = 'changed since it was proven';

const latinDigits = (text: string) =>
  text
    .replaceAll(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replaceAll(/\s+/g, ' ')
    .trim();

function sourceAt(proof: Proof, index: number): Present | undefined {
  const source = proof.sources[index];
  return source?.state === 'present' ? source : undefined;
}

function isIn(proof: Proof, span: Span): boolean {
  return sourceAt(proof, span.source)?.text.includes(span.text) ?? false;
}

function formsOf(body: string): string[] {
  return [...new Set([formOf(body, 'sabah'), formOf(body, 'masaa')])];
}

function nextPageOf(url: string): string | undefined {
  const [, book, page] = url.match(/^(https:\/\/shamela\.ws\/book\/\d+\/)(\d+)$/) ?? [];
  return book && `${book}${Number(page) + 1}`;
}

function readingsOf(proof: Proof, site: Site): number[][] {
  const pages = proof.sources.flatMap((source, index) =>
    source.state === 'present' && source.site === site ? [{ index, url: source.url }] : []
  );
  return pages.flatMap(({ index, url }) => {
    const next = pages.find((other) => other.url === nextPageOf(url));
    return next ? [[index], [index, next.index]] : [[index]];
  });
}

function missingOn(proof: Proof, body: string, site: Site): string[] {
  const spans = proof.claims.text?.spans ?? [];
  const readings = readingsOf(proof, site);

  const missing = formsOf(body).flatMap((form) => {
    const ofEach = readings.map((reading) =>
      missingPhrases(
        form,
        reading.flatMap((index) =>
          spans.filter((span) => span.source === index).map((span) => span.text)
        )
      )
    );
    return ofEach.toSorted((a, b) => a.length - b.length)[0] ?? phrasesIn(form);
  });
  return [...new Set(missing)];
}

function uncoveredOn(proof: Proof, body: string, site: Site): string[] {
  const named = new Set(
    proof.differences
      .filter((difference) => difference.site === site)
      .map((difference) => normalize(difference.phrase))
  );
  return missingOn(proof, body, site).filter((phrase) => !named.has(phrase));
}

function has(proof: Proof, site: Site): boolean {
  return proof.sources.some((source) => source.state === 'present' && source.site === site);
}

function sourceProblems(data: Dhikr, body: string, proof: Proof): string[] {
  const needed: Site[] = data.quran ? ['dorar', 'shamela', 'tanzil'] : ['dorar', 'shamela'];
  const covering: Site[] = data.quran ? ['tanzil'] : needed;

  const missing = needed.filter((site) => !has(proof, site)).map((site) => `${site} is missing`);
  const uncovered = covering
    .filter((site) => has(proof, site))
    .flatMap((site) =>
      uncoveredOn(proof, body, site).map((phrase) => `text: ${site} does not cover «${phrase}»`)
    );
  return [...missing, ...uncovered];
}

function lookupProblems(data: Dhikr, body: string, proof: Proof): string[] {
  const sites = ['hdith', 'sunnah'] as const;
  const problems = sites
    .filter((site) => !proof.sources.some((source) => source.site === site))
    .map((site) => `${site} is not looked up`);

  const covered = COVERED_BOOKS.some((book) => data.takhrij.source.startsWith(book));
  const carries = (site: Site) =>
    has(proof, site) && (data.quran || uncoveredOn(proof, body, site).length === 0);
  if (problems.length === 0 && covered && !sites.some(carries)) {
    problems.push('neither hdith nor sunnah carries the text');
  }
  return problems;
}

function claimProblems(data: Dhikr, proof: Proof, cited: Present | undefined): string[] {
  const made = claimsOf(data);
  const held = Object.keys(proof.claims).filter(
    (claim) => proof.claims[claim as Claim] !== undefined
  ) as Claim[];

  return [
    ...made.filter((claim) => !held.includes(claim)).map((claim) => `${claim} is not proven`),
    ...held
      .filter((claim) => !made.includes(claim))
      .map((claim) => `${claim} is proven but not stated`),
    ...held.flatMap((claim) => {
      const { spans } = proof.claims[claim]!;
      const problems: string[] = [];
      if (!spans.every((span) => isIn(proof, span))) {
        problems.push(`${claim}: a span is not in its source`);
      }
      if (
        spans.length > 0 &&
        spans.every((span) => sourceAt(proof, span.source)?.site === 'alukah')
      ) {
        problems.push(`${claim}: alukah proves nothing alone`);
      }
      if (
        cited &&
        made.includes(claim) &&
        IN_THE_CITED_PAGE.has(claim) &&
        !spans.some((span) => sourceAt(proof, span.source) === cited)
      ) {
        problems.push(`${claim}: no span is from the cited dorar.net page`);
      }
      return problems;
    }),
  ];
}

function differenceProblems(body: string, proof: Proof): string[] {
  return proof.differences.flatMap(({ site, phrase, shown }) => {
    const problems: string[] = [];
    if (!isIn(proof, shown)) {
      problems.push(`difference «${phrase}»: what shows it is not in its source`);
    }
    if (!missingOn(proof, body, site).includes(normalize(phrase))) {
      problems.push(`difference «${phrase}»: ${site} has this phrase`);
    }
    return problems;
  });
}

function sameRuling(cited: Present, takhrij: Dhikr['takhrij']): boolean {
  const ruling = normalize(cited.ruling ?? '');
  if (SAHIHAYN.has(takhrij.grader) && takhrij.ruling === 'صحيح') {
    return ruling === 'صحيح' || ruling.startsWith('أورده في صحيحه');
  }
  return ruling === normalize(takhrij.ruling);
}

function takhrijProblems({ takhrij }: Dhikr, cited: Present | undefined): string[] {
  if (!cited) return ['takhrij: the cited dorar.net page is missing'];
  const problems: string[] = [];
  if (latinDigits(`${cited.book} ${cited.number}`) !== latinDigits(takhrij.source)) {
    problems.push(`takhrij: the source is «${cited.book} ${cited.number}» on the cited page`);
  }
  if (cited.grader !== takhrij.grader) {
    problems.push(`takhrij: the grader is «${cited.grader}» on the cited page`);
  }
  if (!sameRuling(cited, takhrij)) {
    problems.push(`takhrij: the ruling is «${cited.ruling}» on the cited page`);
  }
  return problems;
}

export function statusOf(data: Dhikr, body: string, proof?: Proof): Status {
  if (!proof) return { state: 'unproven', problems: ['has no record'] };

  const cited = proof.sources.find(
    (source): source is Present =>
      source.state === 'present' && source.site === 'dorar' && source.url === data.takhrij.url
  );
  const text = body.trim();
  const expired = claimsOf(data).filter((claim) => {
    const held = proof.claims[claim];
    return held && held.fingerprint !== fingerprintOf(claim, data, body);
  });
  const changed = expired.map((claim) => `${claim} ${CHANGED}`);

  const broken = [
    ...sourceProblems(data, text, proof),
    ...lookupProblems(data, text, proof),
    ...claimProblems(data, proof, cited),
    ...differenceProblems(text, proof),
    ...takhrijProblems(data, cited),
  ];

  if (broken.length > 0) return { state: 'unproven', problems: [...changed, ...broken] };
  if (changed.length > 0) return { state: 'changed', problems: changed };
  return { state: 'proven', problems: [] };
}
