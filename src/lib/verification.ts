import { Array, Effect, Option, Order } from 'effect';
import { CLAIMS, claimsOf, fingerprintOf, type Claim } from './fingerprint';
import { missingPhrases, normalize, phrasesIn } from './matching';
import type { Present, Proof, Site, Source, Span } from './proof';
import type { Dhikr, Takhrij } from './schema';
import { textFormsOf, type MalformedMarker } from './variants';

export type Status = {
  readonly state: 'proven' | 'changed' | 'unproven';
  readonly problems: ReadonlyArray<string>;
};

type Forms = ReadonlyArray<string>;

const COVERED_BOOKS: ReadonlyArray<string> = [
  'صحيح البخاري',
  'صحيح مسلم',
  'صحيح أبي داود',
  'صحيح الترمذي',
  'صحيح النسائي',
  'صحيح ابن ماجه',
  'صحيح الأدب المفرد',
];

const IN_THE_CITED_PAGE: ReadonlySet<Claim> = new Set<Claim>(['count', 'moment', 'fadl']);

const WITHOUT_THE_WORDS: ReadonlySet<string> = new Set(['commanded', 'reported']);

const HELPERS: ReadonlyArray<Site> = ['alukah', 'usul'];

const COMPARED: ReadonlySet<Site> = new Set<Site>(['shamela', 'hdith', 'sunnah']);

const SAHIHAYN: ReadonlySet<string> = new Set(['البخاري', 'مسلم']);

const CHANGED = 'changed since it was proven';

const latinDigits = (text: string) =>
  text
    .replaceAll(/[٠-٩]/gu, (digit) => String((digit.codePointAt(0) ?? 0x0660) - 0x0660))
    .replaceAll(/\s+/gu, ' ')
    .trim();

const isPresent = (source: Source): source is Present => source.state === 'present';

function sourceAt(proof: Proof, index: number): Option.Option<Present> {
  return Option.filter(Array.get(proof.sources, index), isPresent);
}

const siteOf = (proof: Proof, span: Span): Option.Option<Site> =>
  Option.map(sourceAt(proof, span.source), ({ site }) => site);

function isIn(proof: Proof, span: Span): boolean {
  return Option.exists(sourceAt(proof, span.source), ({ text }) => text.includes(span.text));
}

function nextPageOf(url: string): Option.Option<string> {
  return Option.map(
    Option.fromNullishOr(/^(https:\/\/shamela\.ws\/book\/\d+\/)(\d+)$/u.exec(url)),
    ([, book = '', page = '']) => `${book}${String(Number(page) + 1)}`
  );
}

const claimSpans = (proof: Proof, claims: ReadonlyArray<Claim>): ReadonlyArray<Span> =>
  claims.flatMap((claim) => proof.claims[claim]?.spans ?? []);

function readingsOf(proof: Proof, site: Site): ReadonlyArray<ReadonlyArray<number>> {
  const pages = proof.sources.flatMap((source, index) =>
    source.state === 'present' && source.site === site ? [{ index, url: source.url }] : []
  );
  return pages.flatMap(({ index, url }) =>
    Option.match(
      Option.flatMap(nextPageOf(url), (next) =>
        Array.findFirst(pages, (other) => other.url === next)
      ),
      { onSome: (next) => [[index], [index, next.index]], onNone: () => [[index]] }
    )
  );
}

const byLength = Order.mapInput(Order.Number, (phrases: ReadonlyArray<string>) => phrases.length);

function missingOn(proof: Proof, forms: Forms, site: Site): ReadonlyArray<string> {
  const spans = proof.claims.text?.spans ?? [];
  const readings = readingsOf(proof, site);

  const missing = forms.flatMap((form) => {
    const ofEach = readings.map((reading) =>
      missingPhrases(
        form,
        reading.flatMap((index) =>
          spans.filter((span) => span.source === index).map((span) => span.text)
        )
      )
    );
    return Option.getOrElse(Array.head(Array.sort(ofEach, byLength)), () => phrasesIn(form));
  });
  return Array.dedupe(missing);
}

function uncoveredOn(proof: Proof, forms: Forms, site: Site): ReadonlyArray<string> {
  const named = new Set(
    proof.differences
      .filter((difference) => difference.site === site)
      .map((difference) => normalize(difference.phrase))
  );
  return missingOn(proof, forms, site).filter((phrase) => !named.has(phrase));
}

function has(proof: Proof, site: Site): boolean {
  return proof.sources.some((source) => source.state === 'present' && source.site === site);
}

function sourceProblems(data: Dhikr, forms: Forms, proof: Proof): ReadonlyArray<string> {
  const needed: ReadonlyArray<Site> = data.quran
    ? ['dorar', 'shamela', 'tanzil']
    : ['dorar', 'shamela'];
  const covering: ReadonlyArray<Site> = data.quran ? ['tanzil'] : needed;

  const missing = needed.filter((site) => !has(proof, site)).map((site) => `${site} is missing`);
  const uncovered = covering
    .filter((site) => has(proof, site))
    .flatMap((site) =>
      uncoveredOn(proof, forms, site).map((phrase) => `text: ${site} does not cover «${phrase}»`)
    );
  return [...missing, ...uncovered];
}

function strangerProblems(data: Dhikr, proof: Proof): ReadonlyArray<string> {
  const sites = ['shamela', 'hdith', 'sunnah'] as const;
  const without = proof.differences.some(({ reason }) => WITHOUT_THE_WORDS.has(reason));
  if (!data.quran && !without) return [];

  const held = new Set(
    Array.getSomes(
      claimSpans(
        proof,
        CLAIMS.filter((claim) => claim !== 'text')
      ).map((span) => siteOf(proof, span))
    )
  );
  return sites
    .filter((site) => has(proof, site) && !held.has(site))
    .map((site) => `${site}: no page holds the words of its hadith`);
}

function emptyPageProblems(proof: Proof): ReadonlyArray<string> {
  const cut = [...claimSpans(proof, CLAIMS), ...proof.differences.map(({ shown }) => shown)];
  const held = new Set(
    Array.getSomes(cut.map((span) => Option.map(sourceAt(proof, span.source), ({ url }) => url)))
  );
  return proof.sources.flatMap((source) =>
    source.state === 'present' &&
    COMPARED.has(source.site) &&
    !held.has(source.url) &&
    !Option.exists(nextPageOf(source.url), (next) => held.has(next))
      ? [`${source.url} holds no words of the proof`]
      : []
  );
}

function lookupProblems(data: Dhikr, forms: Forms, proof: Proof): ReadonlyArray<string> {
  const sites = ['hdith', 'sunnah'] as const;
  const missing = sites
    .filter((site) => !proof.sources.some((source) => source.site === site))
    .map((site) => `${site} is not looked up`);

  const covered = COVERED_BOOKS.some((book) => data.takhrij.source.startsWith(book));
  const carries = (site: Site) =>
    has(proof, site) && (data.quran || uncoveredOn(proof, forms, site).length === 0);
  return missing.length === 0 && covered && !sites.some((site) => carries(site))
    ? ['neither hdith nor sunnah carries the text']
    : missing;
}

function spanProblems(
  proof: Proof,
  claim: Claim,
  made: boolean,
  cited: Option.Option<Present>
): ReadonlyArray<string> {
  const spans = proof.claims[claim]?.spans ?? [];
  const problems: string[] = [];
  if (!spans.every((span) => isIn(proof, span))) {
    problems.push(`${claim}: a span is not in its source`);
  }
  for (const helper of HELPERS) {
    if (spans.length > 0 && spans.every((span) => Option.contains(siteOf(proof, span), helper))) {
      problems.push(`${claim}: ${helper} proves nothing alone`);
    }
  }
  if (
    Option.isSome(cited) &&
    made &&
    IN_THE_CITED_PAGE.has(claim) &&
    !spans.some((span) =>
      Option.exists(sourceAt(proof, span.source), (source) => source === cited.value)
    )
  ) {
    problems.push(`${claim}: no span is from the cited dorar.net page`);
  }
  return problems;
}

function claimProblems(
  data: Dhikr,
  proof: Proof,
  cited: Option.Option<Present>
): ReadonlyArray<string> {
  const made = claimsOf(data);
  const held = CLAIMS.filter((claim) => proof.claims[claim] !== undefined);

  return [
    ...made.filter((claim) => !held.includes(claim)).map((claim) => `${claim} is not proven`),
    ...held
      .filter((claim) => !made.includes(claim))
      .map((claim) => `${claim} is proven but not stated`),
    ...held.flatMap((claim) => spanProblems(proof, claim, made.includes(claim), cited)),
  ];
}

function differenceProblems(forms: Forms, proof: Proof): ReadonlyArray<string> {
  return proof.differences.flatMap(({ site, phrase, shown }) => {
    const problems: string[] = [];
    if (!isIn(proof, shown)) {
      problems.push(`difference «${phrase}»: what shows it is not in its source`);
    }
    if (!missingOn(proof, forms, site).includes(normalize(phrase))) {
      problems.push(`difference «${phrase}»: ${site} has this phrase`);
    }
    return problems;
  });
}

function sameRuling(cited: Present, takhrij: Takhrij): boolean {
  const ruling = normalize(cited.ruling ?? '');
  if (SAHIHAYN.has(takhrij.grader) && takhrij.ruling === 'صحيح') {
    return ruling === 'صحيح' || ruling.startsWith('أورده في صحيحه');
  }
  return ruling === normalize(takhrij.ruling);
}

function takhrijProblems({ takhrij }: Dhikr, found: Option.Option<Present>): ReadonlyArray<string> {
  if (Option.isNone(found)) return ['takhrij: the cited dorar.net page is missing'];
  const cited = found.value;
  const problems: string[] = [];
  if (latinDigits(`${cited.book} ${cited.number}`) !== latinDigits(takhrij.source)) {
    problems.push(`takhrij: the source is «${cited.book} ${cited.number}» on the cited page`);
  }
  if (cited.grader !== takhrij.grader) {
    problems.push(`takhrij: the grader is «${cited.grader ?? ''}» on the cited page`);
  }
  if (!sameRuling(cited, takhrij)) {
    problems.push(`takhrij: the ruling is «${cited.ruling ?? ''}» on the cited page`);
  }
  return problems;
}

const UNRECORDED: Status = { state: 'unproven', problems: ['has no record'] };

function statusOfProof(data: Dhikr, body: string, forms: Forms, proof: Proof): Status {
  const cited = Array.findFirst(
    proof.sources,
    (source): source is Present =>
      source.state === 'present' && source.site === 'dorar' && source.url === data.takhrij.url
  );
  const expired = claimsOf(data).filter((claim) => {
    const held = proof.claims[claim];
    return held !== undefined && held.fingerprint !== fingerprintOf(claim, data, body);
  });
  const changed = expired.map((claim) => `${claim} ${CHANGED}`);

  const broken = [
    ...sourceProblems(data, forms, proof),
    ...strangerProblems(data, proof),
    ...emptyPageProblems(proof),
    ...lookupProblems(data, forms, proof),
    ...claimProblems(data, proof, cited),
    ...differenceProblems(forms, proof),
    ...takhrijProblems(data, cited),
  ];

  if (broken.length > 0) return { state: 'unproven', problems: [...changed, ...broken] };
  if (changed.length > 0) return { state: 'changed', problems: changed };
  return { state: 'proven', problems: [] };
}

export const statusOf = (
  data: Dhikr,
  body: string,
  record: Option.Option<Proof>
): Effect.Effect<Status, MalformedMarker> =>
  Option.match(record, {
    onNone: () => Effect.succeed(UNRECORDED),
    onSome: (proof) =>
      Effect.map(textFormsOf(body.trim()), (forms) => statusOfProof(data, body, forms, proof)),
  });
