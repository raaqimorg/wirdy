import { Array } from 'effect';

export type Width = 'wide' | 'narrow';

type Block = 'wide' | 'pair';

function blocksOf(count: number): ReadonlyArray<Block> {
  const blocks: Block[] = [];
  let left = count;
  while (left > 0) {
    const next: Block = blocks.length % 2 === 0 || left === 1 ? 'wide' : 'pair';
    blocks.push(next);
    left -= next === 'wide' ? 1 : 2;
  }
  const pair = blocks.indexOf('pair');
  if (blocks.length % 2 === 1 && pair !== -1) blocks.splice(pair, 1, 'wide', 'wide');
  return blocks;
}

export const widthsOf = (count: number): ReadonlyArray<Width> =>
  Array.flatMap(blocksOf(count), (block): ReadonlyArray<Width> =>
    block === 'wide' ? ['wide'] : ['narrow', 'narrow']
  );
