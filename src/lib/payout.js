import { ALL_NUMBERS } from './draws';
import { describeSet } from './stats';

/**
 * ─────────────────────────────────────────────────────────────
 * 분산 전략 (Expected-Value Strategy)
 * ─────────────────────────────────────────────────────────────
 *
 * 로또 1등은 파리뮤추얼 방식이다. 상금 풀을 당첨자 수로 나눠 갖는다.
 * 따라서 "당첨 확률"은 어떤 번호를 골라도 1/8,145,060 으로 똑같지만,
 * **당첨됐을 때 받는 금액의 기댓값**은 다르다.
 * 남들이 적게 고르는 조합일수록 나눠 가질 사람이 적기 때문이다.
 *
 * 이것이 로또에서 수학적으로 유효한 유일한 선택 전략이다.
 * 확률을 바꾸는 것이 아니라 분배 인원을 바꾼다.
 *
 * 사람들이 몰리는 것으로 알려진 패턴:
 *  1) 생일 편향 — 1~31 에 집중된다 (날짜로 고르기 때문).
 *  2) 행운수 편향 — 7 을 비롯한 특정 숫자를 선호한다.
 *  3) 용지 패턴 — 연속번호, 등차수열처럼 규칙적인 조합을 고른다.
 *  4) 과거 당첨 조합 — 지난 당첨 번호를 그대로 따라 적는다.
 *  5) 합계 쏠림 — 대부분의 수동 선택이 합계 100~170 구간에 몰린다.
 */

/** 생일로 고를 수 있는 최대 숫자 */
const BIRTHDAY_MAX = 31;

/**
 * 번호 하나의 "비인기도" 0~1. 높을수록 남들이 덜 고른다.
 * 32~45 는 날짜로 표현할 수 없어 구조적으로 덜 선택된다.
 */
export function unpopularity(n) {
  let score = n > BIRTHDAY_MAX ? 0.62 : 0.35;

  // 1~12 는 '월'로도 쓰여 특히 더 몰린다.
  if (n <= 12) score -= 0.12;

  // 7 은 대표적인 행운수라 선호가 강하다.
  if (n === 7) score -= 0.1;

  return Math.min(Math.max(score, 0), 1);
}

/**
 * 32~45 를 몇 개 포함했는지에 따른 보정.
 * 전부 저번호면 생일 조합과 겹치고, 전부 고번호면 같은 전략을 쓰는 사람들과
 * 겹친다. 3개 안팎이 가장 한산하다.
 */
const HIGH_COUNT_PENALTY = [16, 8, 2, 0, 2, 10, 20];

/**
 * 조합이 지금까지 당첨된 적 있는지 확인한다.
 * 과거 당첨 조합을 그대로 적는 사람이 꾸준히 있어 분배 인원이 늘어난다.
 */
export function hasWonBefore(numbers, draws) {
  const key = [...numbers].sort((a, b) => a - b).join(',');
  return draws.some((d) => d.numbers.join(',') === key);
}

/** 등차수열(예: 3,8,13,18,23,28)인지 */
function isArithmetic(sorted) {
  const step = sorted[1] - sorted[0];
  return sorted.every((n, i) => i === 0 || n - sorted[i - 1] === step);
}

/**
 * 조합의 "인기도" 0~100. **낮을수록 좋다** (나눠 가질 사람이 적다).
 * 당첨 확률과는 무관하며, 당첨 시 분배 인원에만 영향을 준다.
 */
export function popularityIndex(numbers, draws = []) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const info = describeSet(sorted);

  // 1) 번호별 비인기도 평균 → 인기도로 뒤집는다.
  const avgUnpop =
    sorted.reduce((acc, n) => acc + unpopularity(n), 0) / sorted.length;
  let score = (1 - avgUnpop) * 100;

  // 2) 저번호/고번호 쏠림 보정.
  // 전부 1~31 이면 생일 조합과 겹치고, 32~45 는 14개뿐이라 전부 그쪽이면
  // C(14,6)=3,003 개의 좁은 공간에서 같은 전략을 쓰는 사람들과 겹친다.
  score += HIGH_COUNT_PENALTY[sorted.filter((n) => n > BIRTHDAY_MAX).length];

  // 3) 규칙적인 패턴은 수동 선택에서 자주 나온다.
  if (info.consecutive >= 3) score += 12;
  else if (info.consecutive === 2) score += 5;
  if (isArithmetic(sorted)) score += 20;

  // 4) 합계가 중앙(138)에 가까울수록 남들과 겹칠 확률이 높다.
  score += Math.max(0, 8 - Math.abs(info.sum - 138) / 6);

  // 5) 과거 당첨 조합은 따라 적는 사람이 있다.
  if (hasWonBefore(sorted, draws)) score += 25;

  return Math.round(Math.min(Math.max(score, 0), 100));
}

/**
 * 인기도를 바탕으로 1등 당첨 시 예상 분배 인원을 대략 추정한다.
 * 국내 1등 당첨자는 회차당 평균 7~8명 수준이므로 이를 기준선으로 잡고
 * 인기도에 따라 위아래로 움직인다.
 *
 * 정밀한 예측이 아니라 조합 간 상대 비교를 위한 지표다.
 */
export function estimatedSplit(popularity) {
  const BASELINE = 7.5; // 국내 1등 당첨자 회차 평균
  // 인기도 50 에서 정확히 기준선이 되도록 맞춘다.
  const factor = 0.35 + (popularity / 100) * 1.3;
  return Math.max(1, BASELINE * factor);
}

/**
 * 인기도를 사람이 읽을 등급으로 바꾼다.
 * 구간은 실제 생성 결과 분포에 맞춰 잡았다.
 * (분산 전략 ≈ 50 안팎, 무작위 ≈ 70 안팎)
 */
export function popularityGrade(popularity) {
  if (popularity < 46) return { label: '매우 희귀', tone: 'best' };
  if (popularity < 57) return { label: '희귀', tone: 'good' };
  if (popularity < 67) return { label: '보통', tone: 'mid' };
  if (popularity < 77) return { label: '인기', tone: 'warn' };
  return { label: '매우 인기', tone: 'bad' };
}

/**
 * 분배 인원을 줄이는 방향으로 가중치를 만든다.
 * predictor 의 'spread' 전략이 이 값을 쓴다.
 */
export function spreadWeights() {
  const weights = {};
  for (const n of ALL_NUMBERS) {
    weights[n] = 0.15 + unpopularity(n) ** 1.4;
  }
  return weights;
}
