export type Rgba = readonly [number, number, number, number];

export type Family = 'text' | 'leading' | 'space' | 'radius' | 'border' | 'offset' | 'color';

export type Sample = {
  readonly selector: string;
  readonly context: number;
  readonly property: string;
  readonly value: string;
  readonly number: number | null;
  readonly color: Rgba | null;
  readonly current: Rgba | null;
};

export type ColorToken = { readonly value: string; readonly color: Rgba };

export type Reading = {
  readonly lengths: Readonly<Record<string, number>>;
  readonly leadings: Readonly<Record<string, number>>;
  readonly contexts: ReadonlyArray<Readonly<Record<string, ColorToken>>>;
  readonly samples: ReadonlyArray<Sample>;
  readonly elements: number;
};

export type Flag = {
  readonly selector: string;
  readonly property: string;
  readonly family: Family;
  readonly value: string;
  readonly nearest: string | null;
};

const FAMILIES: ReadonlyArray<readonly [RegExp, Family]> = [
  [/^font-size$/u, 'text'],
  [/^line-height$/u, 'leading'],
  [/^outline-offset$/u, 'offset'],
  [/-radius$/u, 'radius'],
  [/^(border-[a-z]+-width|outline-width|stroke-width)$/u, 'border'],
  [/color$|^fill$|^stroke$/u, 'color'],
];

export const familyOf = (property: string): Family =>
  FAMILIES.find(([pattern]) => pattern.test(property))?.[1] ?? 'space';

const PREFIXES: Readonly<Record<Exclude<Family, 'color' | 'leading'>, ReadonlyArray<string>>> = {
  text: ['--text-'],
  space: ['--space-'],
  radius: ['--radius-'],
  border: ['--border-', '--stroke-'],
  offset: ['--ring-'],
};

const LENGTH_TOLERANCE = 0.05;
const LEADING_TOLERANCE = 0.01;
const CHANNEL_TOLERANCE = 2;
const ALPHA_TOLERANCE = 0.02;

const nearestOf = (value: number, tokens: ReadonlyArray<readonly [string, number]>) => {
  const sorted = tokens.toSorted(([, a], [, b]) => Math.abs(a - value) - Math.abs(b - value));
  const first = sorted[0];
  return first === undefined ? null : `${first[0]} (${String(round(first[1]))})`;
};

const round = (value: number) => Math.round(value * 100) / 100;

const lengthFlag = (sample: Sample, family: Family, reading: Reading): string | null | false => {
  if (sample.number === null) return null;
  if (Math.abs(sample.number) < LENGTH_TOLERANCE) return false;
  const prefixes = family === 'leading' || family === 'color' ? [] : PREFIXES[family];
  const tokens = Object.entries(family === 'leading' ? reading.leadings : reading.lengths).filter(
    ([name]) => family === 'leading' || prefixes.some((prefix) => name.startsWith(prefix))
  );
  const tolerance = family === 'leading' ? LEADING_TOLERANCE : LENGTH_TOLERANCE;
  const size = Math.abs(sample.number);
  if (tokens.some(([, value]) => Math.abs(Math.abs(value) - size) <= tolerance)) return false;
  return nearestOf(size, tokens);
};

const isSameColor = (a: Rgba, b: Rgba) =>
  Math.abs(a[0] - b[0]) <= CHANNEL_TOLERANCE &&
  Math.abs(a[1] - b[1]) <= CHANNEL_TOLERANCE &&
  Math.abs(a[2] - b[2]) <= CHANNEL_TOLERANCE &&
  Math.abs(a[3] - b[3]) <= ALPHA_TOLERANCE;

const distanceOf = (a: Rgba, b: Rgba) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], (a[3] - b[3]) * 255);

const colorFlag = (sample: Sample, reading: Reading): string | null | false => {
  const { color } = sample;
  if (color === null) return null;
  if (color[3] <= ALPHA_TOLERANCE) return false;
  if (sample.current !== null && isSameColor(color, sample.current)) return false;
  const tokens = Object.entries(reading.contexts[sample.context] ?? reading.contexts[0] ?? {});
  if (tokens.some(([, token]) => token.value === sample.value || isSameColor(token.color, color)))
    return false;
  const sorted = tokens.toSorted(
    ([, a], [, b]) => distanceOf(a.color, color) - distanceOf(b.color, color)
  );
  return sorted[0] === undefined ? null : sorted[0][0];
};

export const flagsOf = (reading: Reading): ReadonlyArray<Flag> =>
  reading.samples.flatMap((sample) => {
    const family = familyOf(sample.property);
    const nearest =
      family === 'color' ? colorFlag(sample, reading) : lengthFlag(sample, family, reading);
    if (nearest === false) return [];
    return [
      {
        selector: sample.selector,
        property: sample.property,
        family,
        value: sample.value,
        nearest,
      },
    ];
  });

export type Place = {
  readonly engine: string;
  readonly viewport: string;
  readonly mode: string;
  readonly state: string;
  readonly page: string;
};

export type Finding = Flag & { readonly places: ReadonlyArray<Place> };

export const keyOf = ({
  selector,
  property,
  value,
}: Pick<Flag, 'selector' | 'property' | 'value'>) => `${selector}|${property}|${value}`;

export const findingsOf = (
  runs: ReadonlyArray<{ readonly place: Place; readonly flags: ReadonlyArray<Flag> }>
): ReadonlyArray<Finding> => {
  const found = new Map<string, { flag: Flag; places: Array<Place> }>();
  for (const { place, flags } of runs) {
    for (const flag of flags) {
      const key = keyOf(flag);
      const entry = found.get(key) ?? { flag, places: [] };
      entry.places.push(place);
      found.set(key, entry);
    }
  }
  return [...found.values()]
    .map(({ flag, places }) => Object.assign({ places }, flag))
    .toSorted((a, b) => b.places.length - a.places.length || keyOf(a).localeCompare(keyOf(b)));
};

export const summaryOf = (findings: ReadonlyArray<Finding>, captures: number): string => {
  const families = new Map<Family, number>();
  for (const { family } of findings) families.set(family, (families.get(family) ?? 0) + 1);
  const lines = [
    `${String(captures)} captures, ${String(findings.length)} values that resolve to no token`,
    ...[...families.entries()]
      .toSorted(([, a], [, b]) => b - a)
      .map(([family, count]) => `  ${family}: ${String(count)}`),
    'most seen:',
    ...findings
      .slice(0, 15)
      .map(
        ({ selector, property, value, nearest, places }) =>
          `  ${String(places.length).padStart(4)}× ${selector} ${property}: ${value}${nearest === null ? '' : ` (nearest ${nearest})`}`
      ),
  ];
  return lines.join('\n');
};

export const readCensus = ({
  names,
  extras,
}: {
  readonly names: ReadonlyArray<string>;
  readonly extras: Readonly<Record<string, string>>;
}): Reading => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- readCensus runs in the page, so its helpers live inside it
  const pxOf = (value: string) => Number(value.trim().replace(/px$/u, ''));
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const paint = canvas.getContext('2d', { willReadFrequently: true });
  const rgbaOf = (value: string): [number, number, number, number] | null => {
    if (paint === null) return null;
    paint.clearRect(0, 0, 1, 1);
    paint.fillStyle = 'rgb(1 2 3 / 0.5)';
    paint.fillStyle = value;
    paint.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = paint.getImageData(0, 0, 1, 1).data;
    return [r, g, b, Math.round((a / 255) * 1000) / 1000];
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- readCensus runs in the page, so its helpers live inside it
  const probeIn = (parent: Element) => {
    const probe = document.createElement('i');
    probe.style.display = 'none';
    parent.append(probe);
    return probe;
  };

  const lengths: Record<string, number> = {};
  const leadings: Record<string, number> = {};
  const rootProbe = probeIn(document.body);
  for (const name of names) {
    if (name.startsWith('--leading-')) {
      leadings[name] = Number(
        getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      );
      continue;
    }
    if (name.startsWith('--color-') || name.startsWith('--tone')) continue;
    rootProbe.style.marginLeft = `var(${name})`;
    const value = pxOf(getComputedStyle(rootProbe).marginLeft);
    rootProbe.style.marginLeft = '';
    if (Number.isFinite(value)) lengths[name] = value;
  }
  rootProbe.remove();

  const colorNames = new Set(
    names.filter((name) => name.startsWith('--color-') || name.startsWith('--tone'))
  );
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      rules = null;
    }
    if (rules === null) continue;
    const walk = (list: CSSRuleList) => {
      for (const rule of list) {
        if (rule instanceof CSSStyleRule) {
          for (const property of rule.style) {
            if (property.startsWith('--tone')) colorNames.add(property);
          }
        }
        if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) walk(rule.cssRules);
      }
    };
    walk(rules);
  }

  const contextElements: Array<Element> = [document.documentElement];
  const contexts: Array<Record<string, { value: string; color: Rgba }>> = [];
  const colorsIn = (parent: Element) => {
    const probe = probeIn(parent === document.documentElement ? document.body : parent);
    const found: Record<string, { value: string; color: Rgba }> = {};
    for (const name of colorNames) {
      probe.style.color = `var(${name})`;
      const value = getComputedStyle(probe).color;
      const color = rgbaOf(value);
      if (color !== null && probe.style.color !== '') found[name] = { value, color };
      probe.style.color = '';
    }
    probe.remove();
    for (const [name, value] of Object.entries(extras)) {
      const color = rgbaOf(value);
      if (color !== null) found[name] = { value, color };
    }
    return found;
  };
  contexts.push(colorsIn(document.documentElement));
  const contextOf = (element: Element) => {
    const tone = element.closest('.tone');
    if (tone === null) return 0;
    const known = contextElements.indexOf(tone);
    if (known !== -1) return known;
    contextElements.push(tone);
    contexts.push(colorsIn(tone));
    return contextElements.length - 1;
  };

  const nameOf = (element: Element): string => {
    const tag = element.tagName.toLowerCase();
    const classes = [...element.classList].filter((name) => name !== 'tone').slice(0, 2);
    if (classes.length > 0) return `${tag}.${classes.join('.')}`;
    const parent = element.parentElement?.closest('[class]');
    return parent === null || parent === undefined ? tag : `${nameOf(parent)} ${tag}`;
  };

  const SKIP = new Set([
    'SCRIPT',
    'STYLE',
    'TEMPLATE',
    'NOSCRIPT',
    'META',
    'LINK',
    'TITLE',
    'HEAD',
    'BR',
  ]);
  const SIDES = ['top', 'right', 'bottom', 'left'] as const;
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const;
  const seen = new Set<string>();
  const samples: Array<Sample> = [];
  let elements = 0;

  // oxlint-disable-next-line unicorn/consistent-function-scoping -- readCensus runs in the page, so its helpers live inside it
  const lengthOf = (element: Element, property: string, style: CSSStyleDeclaration) => {
    const typed =
      'computedStyleMap' in element ? element.computedStyleMap().get(property) : undefined;
    if (typed instanceof CSSKeywordValue) return { value: typed.value, number: null, skip: true };
    if (typed instanceof CSSUnitValue && typed.unit === 'px')
      return {
        value: `${String(Math.round(typed.value * 100) / 100)}px`,
        number: typed.value,
        skip: false,
      };
    if (typed !== undefined && !(typed instanceof CSSUnitValue && typed.unit === 'number'))
      return { value: typed.toString(), number: null, skip: false };
    const raw = style.getPropertyValue(property);
    const number = pxOf(raw);
    return {
      value: raw,
      number: Number.isFinite(number) ? number : null,
      skip: false,
    };
  };

  for (const element of document.querySelectorAll('body, body *')) {
    if (SKIP.has(element.tagName)) continue;
    if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    if (element.closest('.visually-hidden') !== null) continue;
    elements += 1;
    const style = getComputedStyle(element);
    const selector = nameOf(element);
    const context = contextOf(element);
    const current = rgbaOf(style.color);
    const add = (property: string, value: string, number: number | null, color: Rgba | null) => {
      const key = `${selector}|${String(context)}|${property}|${value}`;
      if (seen.has(key)) return;
      seen.add(key);
      samples.push({
        selector,
        context,
        property,
        value,
        number,
        color,
        current: color === null ? null : current,
      });
    };
    const addColor = (property: string) => {
      const value = style.getPropertyValue(property);
      if (value === '' || value === 'none') return;
      const color = rgbaOf(value);
      if (color === null || color[3] === 0) return;
      add(property, value, null, color);
    };
    const addLength = (property: string) => {
      const { value, number, skip } = lengthOf(element, property, style);
      if (skip || number === 0 || value === '0px' || value === 'normal' || value === '') return;
      add(property, value, number, null);
    };

    const text = [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
    );
    const field = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
    if (text || field) {
      const size = pxOf(style.fontSize);
      add('font-size', style.fontSize, size, null);
      const leading = pxOf(style.lineHeight);
      add(
        'line-height',
        style.lineHeight,
        Number.isFinite(leading) ? Math.round((leading / size) * 1000) / 1000 : null,
        null
      );
      addColor('color');
    }
    if (element instanceof SVGElement) {
      if (element instanceof SVGGraphicsElement && !(element instanceof SVGSVGElement)) {
        addColor('fill');
        addColor('stroke');
        if (style.stroke !== 'none' && element.closest('.emblem') === null)
          addLength('stroke-width');
      }
      continue;
    }
    addColor('background-color');
    for (const side of SIDES) {
      addLength(`margin-${side}`);
      addLength(`padding-${side}`);
      if (style.getPropertyValue(`border-${side}-style`) === 'none') continue;
      addLength(`border-${side}-width`);
      addColor(`border-${side}-color`);
    }
    if (/flex|grid/u.test(style.display)) {
      addLength('row-gap');
      addLength('column-gap');
    }
    for (const corner of CORNERS) {
      const value = style.getPropertyValue(`border-${corner}-radius`);
      if (value === '0px' || value === '') continue;
      const number = pxOf(value);
      add(`border-${corner}-radius`, value, Number.isFinite(number) ? number : null, null);
    }
    if (style.outlineStyle !== 'none') {
      addLength('outline-width');
      addColor('outline-color');
      addLength('outline-offset');
    }
  }
  return { lengths, leadings, contexts, samples, elements };
};
