import { rankAgainst } from './prize';

/** 한 게임 가격 */
export const TICKET_PRICE = 1000;

/**
 * 등수별 1인당 평균 당첨금(원).
 * 1~3등은 파리뮤추얼이라 회차마다 다르므로 최근 수년 평균에 가까운 값을 쓴다.
 * 4·5등은 금액이 고정되어 있다.
 */
export const AVG_PRIZE = {
  1: 2_000_000_000,
  2: 55_000_000,
  3: 1_500_000,
  4: 50_000,
  5: 5_000,
};

export const RANK_ORDER = [1, 2, 3, 4, 5];

/**
 * 이 번호로 모든 회차를 샀다면 어떻게 됐을지 계산한다.
 *
 * @returns {{
 *   results: Array<{round:number, rank:number, matchCount:number}>,
 *   byRank: Record<number, number>,
 *   spent: number, won: number, net: number, roi: number,
 *   best: {rank:number, round:number}|null,
 *   hitRate: number
 * }}
 */
export function simulate(numbers, draws) {
  const byRank = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const results = [];
  let won = 0;
  let best = null;

  for (const draw of draws) {
    const { rank, matchCount } = rankAgainst(numbers, draw);
    results.push({ round: draw.round, rank, matchCount });

    if (rank) {
      byRank[rank] += 1;
      won += AVG_PRIZE[rank];
      if (!best || rank < best.rank) best = { rank, round: draw.round };
    }
  }

  const spent = draws.length * TICKET_PRICE;
  const hits = RANK_ORDER.reduce((acc, r) => acc + byRank[r], 0);

  return {
    results,
    byRank,
    spent,
    won,
    net: won - spent,
    roi: spent > 0 ? (won - spent) / spent : 0,
    best,
    hitRate: draws.length ? hits / draws.length : 0,
  };
}

/**
 * 무작위 조합 여러 개를 돌려 평균을 낸다.
 * "내 번호가 특별히 나쁜 건 아니다"를 보여 주는 비교 기준으로 쓴다.
 */
export function baselineSimulation(draws, trials = 60) {
  let totalWon = 0;
  for (let t = 0; t < trials; t++) {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    const pick = [];
    for (let i = 0; i < 6; i++) {
      pick.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    }
    totalWon += simulate(pick.sort((a, b) => a - b), draws).won;
  }
  return totalWon / trials;
}

/** 큰 금액을 읽기 쉬운 한국어 단위로 */
export function formatKrw(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000).toLocaleString()}만원`;
  return `${sign}${abs.toLocaleString()}원`;
}
