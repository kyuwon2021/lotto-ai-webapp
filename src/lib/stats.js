import { ALL_NUMBERS, sectionOf } from './draws';

const emptyCounts = () => {
  const o = {};
  for (const n of ALL_NUMBERS) o[n] = 0;
  return o;
};

/** 번호별 전체 출현 횟수 */
export function frequency(draws) {
  const freq = emptyCounts();
  for (const d of draws) for (const n of d.numbers) freq[n] += 1;
  return freq;
}

/** 최근 `window`회 기준 출현 횟수 */
export function recentFrequency(draws, window = 10) {
  return frequency(draws.slice(-window));
}

/**
 * 번호별 "미출현 회차 수".
 * 0 = 직전 회차에 나옴. 한 번도 안 나온 번호는 전체 회차 수를 갖는다.
 */
export function drought(draws) {
  const gap = {};
  for (const n of ALL_NUMBERS) gap[n] = draws.length;
  for (let i = draws.length - 1, age = 0; i >= 0; i--, age++) {
    for (const n of draws[i].numbers) {
      if (gap[n] === draws.length) gap[n] = age;
    }
  }
  return gap;
}

/** 두 번호가 함께 나온 횟수 (키: "a-b", a < b) */
export function pairFrequency(draws) {
  const pairs = {};
  for (const d of draws) {
    for (let i = 0; i < d.numbers.length; i++) {
      for (let j = i + 1; j < d.numbers.length; j++) {
        const key = `${d.numbers[i]}-${d.numbers[j]}`;
        pairs[key] = (pairs[key] || 0) + 1;
      }
    }
  }
  return pairs;
}

export function topPairs(draws, limit = 8) {
  return Object.entries(pairFrequency(draws))
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number);
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count || x.a - y.a)
    .slice(0, limit);
}

/** 한 세트(6개)의 구조적 특성 요약 */
export function describeSet(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const odd = sorted.filter((n) => n % 2 === 1).length;

  const sections = [0, 0, 0, 0, 0];
  for (const n of sorted) sections[sectionOf(n)] += 1;

  let consecutive = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) consecutive += 1;
  }

  return {
    sum,
    odd,
    even: 6 - odd,
    sections,
    consecutive,
    low: sorted.filter((n) => n <= 22).length,
    high: sorted.filter((n) => n > 22).length,
    span: sorted[5] - sorted[0],
  };
}

/** 과거 회차들의 합계 분포를 버킷으로 묶어 반환 */
export function sumDistribution(draws, bucketSize = 20) {
  const buckets = new Map();
  for (const d of draws) {
    const sum = d.numbers.reduce((a, n) => a + n, 0);
    const key = Math.floor(sum / bucketSize) * bucketSize;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([start, count]) => ({
      label: `${start}–${start + bucketSize - 1}`,
      count,
    }));
}

/** 홀수 개수(0~6) 별 회차 수 */
export function oddEvenDistribution(draws) {
  const counts = Array.from({ length: 7 }, () => 0);
  for (const d of draws) {
    counts[d.numbers.filter((n) => n % 2 === 1).length] += 1;
  }
  return counts.map((count, odd) => ({
    label: `홀 ${odd} : 짝 ${6 - odd}`,
    count,
  }));
}

/** 구간별 전체 출현 횟수 */
export function sectionDistribution(draws) {
  const counts = [0, 0, 0, 0, 0];
  for (const d of draws) for (const n of d.numbers) counts[sectionOf(n)] += 1;
  return counts;
}

/** 과거 회차 평균 합계 — 생성 세트의 "정상 범위" 판단에 사용 */
export function averageSum(draws) {
  if (!draws.length) return 138;
  const total = draws.reduce(
    (acc, d) => acc + d.numbers.reduce((a, n) => a + n, 0),
    0
  );
  return total / draws.length;
}
