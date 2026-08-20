/**
 * 한 세트를 특정 회차와 대조해 등수를 판정한다.
 * 1등 6개 / 2등 5개+보너스 / 3등 5개 / 4등 4개 / 5등 3개.
 */
export function rankAgainst(numbers, draw) {
  const winning = new Set(draw.numbers);
  const matches = numbers.filter((n) => winning.has(n));
  const hasBonus = numbers.includes(draw.bonus);

  let rank = 0;
  if (matches.length === 6) rank = 1;
  else if (matches.length === 5 && hasBonus) rank = 2;
  else if (matches.length === 5) rank = 3;
  else if (matches.length === 4) rank = 4;
  else if (matches.length === 3) rank = 5;

  return { rank, matches, matchCount: matches.length, hasBonus };
}

export const RANK_LABEL = {
  0: '낙첨',
  1: '1등',
  2: '2등',
  3: '3등',
  4: '4등',
  5: '5등',
};

/** 세트를 전체 회차와 대조해 최고 성적을 찾는다. */
export function bestResult(numbers, draws) {
  let best = { rank: 0, matchCount: 0, draw: null, hasBonus: false };
  for (const draw of draws) {
    const result = rankAgainst(numbers, draw);
    const better =
      (result.rank !== 0 && (best.rank === 0 || result.rank < best.rank)) ||
      (result.rank === 0 &&
        best.rank === 0 &&
        result.matchCount > best.matchCount);
    if (better) best = { ...result, draw };
  }
  return best;
}
