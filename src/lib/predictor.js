import { ALL_NUMBERS } from './draws';
import {
  frequency,
  recentFrequency,
  drought,
  pairFrequency,
  describeSet,
  averageSum,
} from './stats';

/* ------------------------------------------------------------------ *
 * 점수 모델
 * ------------------------------------------------------------------ */

/**
 * 번호별 점수를 4개 성분으로 나눠 계산한다.
 * 각 성분은 0~1로 정규화되므로 UI에서 "왜 이 번호인지" 그대로 보여줄 수 있다.
 *
 *  - base   : 전체 기간 출현 빈도
 *  - recent : 최근 흐름(최근 20회 가중)
 *  - due    : 오래 안 나온 번호에 주는 보정
 *  - synergy: 다른 번호와 함께 나온 정도(동반 출현)
 */
export function buildModel(draws) {
  const total = Math.max(draws.length, 1);
  const freq = frequency(draws);
  const recent = recentFrequency(draws, Math.min(20, total));
  const gap = drought(draws);
  const pairs = pairFrequency(draws);

  const synergyRaw = {};
  for (const n of ALL_NUMBERS) synergyRaw[n] = 0;
  for (const [key, count] of Object.entries(pairs)) {
    const [a, b] = key.split('-').map(Number);
    synergyRaw[a] += count;
    synergyRaw[b] += count;
  }

  const norm = (obj) => {
    const values = Object.values(obj);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const out = {};
    for (const n of ALL_NUMBERS) out[n] = (obj[n] - min) / span;
    return out;
  };

  const base = norm(freq);
  const heat = norm(recent);
  const due = norm(gap);
  const synergy = norm(synergyRaw);

  const WEIGHTS = { base: 0.3, recent: 0.35, due: 0.2, synergy: 0.15 };

  const model = {};
  for (const n of ALL_NUMBERS) {
    const parts = {
      base: base[n],
      recent: heat[n],
      due: due[n],
      synergy: synergy[n],
    };
    const score =
      parts.base * WEIGHTS.base +
      parts.recent * WEIGHTS.recent +
      parts.due * WEIGHTS.due +
      parts.synergy * WEIGHTS.synergy;

    model[n] = {
      number: n,
      score,
      parts,
      hits: freq[n],
      recentHits: recent[n],
      drought: gap[n],
    };
  }

  return { model, weights: WEIGHTS, drawCount: draws.length };
}

/* ------------------------------------------------------------------ *
 * 가중 추출
 * ------------------------------------------------------------------ */

function weightedPick(candidates, weightOf) {
  const total = candidates.reduce((acc, n) => acc + Math.max(weightOf(n), 0), 0);
  if (total <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let r = Math.random() * total;
  for (const n of candidates) {
    r -= Math.max(weightOf(n), 0);
    if (r <= 0) return n;
  }
  return candidates[candidates.length - 1];
}

/** 비복원 가중 추출로 count개를 뽑는다. */
export function pickWeighted(pool, weightOf, count) {
  const candidates = [...pool];
  const picked = [];
  while (picked.length < count && candidates.length) {
    const n = weightedPick(candidates, weightOf);
    picked.push(n);
    candidates.splice(candidates.indexOf(n), 1);
  }
  return picked.sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ *
 * 생성 전략
 * ------------------------------------------------------------------ */

export const STRATEGIES = {
  ai: {
    key: 'ai',
    label: 'AI 종합',
    hint: '빈도·최근 흐름·미출현·동반 출현을 모두 반영합니다.',
  },
  hot: {
    key: 'hot',
    label: '핫 넘버',
    hint: '최근 자주 나온 번호에 무게를 둡니다.',
  },
  cold: {
    key: 'cold',
    label: '콜드 넘버',
    hint: '오래 나오지 않은 번호에 무게를 둡니다.',
  },
  balanced: {
    key: 'balanced',
    label: '균형 조합',
    hint: '홀짝·구간·합계가 과거 평균에 가깝도록 맞춥니다.',
  },
  spread: {
    key: 'spread',
    label: '분산 전략 ⭐',
    hint:
      '당첨 확률은 어떤 번호든 같습니다. 대신 남들이 덜 고르는 조합을 만들어, ' +
      '1등이 됐을 때 나눠 가질 사람 수를 줄입니다. 기댓값을 높이는 유일한 방법입니다.',
  },
  random: {
    key: 'random',
    label: '완전 랜덤',
    hint: '통계를 쓰지 않는 순수 무작위입니다.',
  },
};

const weightFor = (strategy, entry, extra) => {
  switch (strategy) {
    case 'hot':
      return 0.05 + entry.parts.recent ** 2;
    case 'cold':
      return 0.05 + entry.parts.due ** 2;
    case 'spread':
      return extra?.spread?.[entry.number] ?? 1;
    case 'random':
      return 1;
    case 'balanced':
    case 'ai':
    default:
      return 0.05 + entry.score ** 1.5;
  }
};

/**
 * 한 세트를 생성한다.
 * @param {object} opts.model     buildModel(...).model
 * @param {string} opts.strategy  STRATEGIES 키
 * @param {number[]} opts.exclude 제외할 번호
 * @param {number[]} opts.include 반드시 포함할 번호
 * @param {number} opts.targetSum 균형 전략이 맞추려는 합계
 */
export function generateSet({
  model,
  strategy = 'ai',
  exclude = [],
  include = [],
  targetSum = 138,
  spread = null,
  scoreCombo = null,
}) {
  const locked = include.slice(0, 6);
  const blocked = new Set([...exclude, ...locked]);
  const pool = ALL_NUMBERS.filter((n) => !blocked.has(n));
  const need = 6 - locked.length;

  if (need <= 0) return locked.slice(0, 6).sort((a, b) => a - b);
  if (pool.length <= need) {
    return [...locked, ...pool].slice(0, 6).sort((a, b) => a - b);
  }

  const draw = () =>
    [
      ...locked,
      ...pickWeighted(pool, (n) => weightFor(strategy, model[n], { spread }), need),
    ].sort((a, b) => a - b);

  // 분산 전략: 인기도가 충분히 낮은 후보들을 모아 그중 하나를 무작위로 고른다.
  // 매번 최솟값만 쫓으면 조합이 거의 똑같아져 다양성이 사라진다.
  if (strategy === 'spread' && scoreCombo) {
    const pool2 = [];
    let fallback = null;
    let fallbackScore = Infinity;

    for (let attempt = 0; attempt < 60; attempt++) {
      const candidate = draw();
      const score = scoreCombo(candidate);
      if (score < fallbackScore) {
        fallbackScore = score;
        fallback = candidate;
      }
      if (score <= 32) pool2.push(candidate);
      if (pool2.length >= 8) break;
    }

    return pool2.length
      ? pool2[Math.floor(Math.random() * pool2.length)]
      : (fallback ?? draw());
  }

  if (strategy !== 'balanced') return draw();

  // 균형 전략: 구조 조건을 만족하는 후보를 여러 번 시도해서 고른다.
  let best = null;
  let bestPenalty = Infinity;
  for (let attempt = 0; attempt < 200; attempt++) {
    const candidate = draw();
    const info = describeSet(candidate);
    const usedSections = info.sections.filter((c) => c > 0).length;

    const penalty =
      Math.abs(info.sum - targetSum) / 20 +
      Math.abs(info.odd - 3) * 1.2 +
      Math.max(0, 3 - usedSections) * 1.5 +
      Math.max(0, info.consecutive - 1) * 1.0;

    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = candidate;
    }
    if (penalty < 0.6) break;
  }
  return best ?? draw();
}

/** 서로 중복되지 않는 세트를 count개 생성 */
export function generateSets(options, count = 5) {
  const seen = new Set();
  const sets = [];
  for (let guard = 0; sets.length < count && guard < count * 40; guard++) {
    const set = generateSet(options);
    const key = set.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    sets.push(set);
  }
  return sets;
}

/* ------------------------------------------------------------------ *
 * 세트 평가
 * ------------------------------------------------------------------ */

/**
 * 생성된 세트가 "과거 당첨 조합들과 얼마나 비슷한 구조인지"를 0~100으로 표현한다.
 * 당첨 확률과는 무관하며, 조합의 균형을 보여주기 위한 지표다.
 */
export function structureScore(numbers, draws) {
  const info = describeSet(numbers);
  const target = averageSum(draws);

  const sumFit = Math.max(0, 1 - Math.abs(info.sum - target) / 90);
  const oddFit = Math.max(0, 1 - Math.abs(info.odd - 3) / 3);
  const spreadFit = info.sections.filter((c) => c > 0).length / 5;
  const clumpFit = Math.max(0, 1 - info.consecutive / 3);

  const raw =
    sumFit * 0.35 + oddFit * 0.25 + spreadFit * 0.25 + clumpFit * 0.15;
  return Math.round(raw * 100);
}

/** 세트에서 모델 점수가 가장 높은 번호 몇 개 — "핵심 번호" 표시용 */
export function keyNumbers(numbers, model, count = 2) {
  return [...numbers]
    .sort((a, b) => model[b].score - model[a].score)
    .slice(0, count);
}
