import { lottoDataStr } from '../data/lottoData';

/**
 * 원본 문자열을 회차 객체 배열로 변환한다.
 * 형식: "1201 7, 9, 24, 27, 35, 36 37" (회차 / 당첨번호 6개 / 보너스)
 * 반환 배열은 오래된 회차 -> 최신 회차 순(오름차순)으로 정렬된다.
 */
export function parseDraws(raw = lottoDataStr) {
  return raw
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const tokens = line.split(/[\s,]+/).filter(Boolean).map(Number);
      const [round, ...rest] = tokens;
      return {
        round,
        numbers: rest.slice(0, 6).sort((a, b) => a - b),
        bonus: rest[6],
      };
    })
    .filter((d) => Number.isFinite(d.round) && d.numbers.length === 6)
    .sort((a, b) => a.round - b.round);
}

export const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

/** 번호가 속한 구간(1~10, 11~20 ...)의 인덱스 0..4 */
export const sectionOf = (n) => Math.min(Math.floor((n - 1) / 10), 4);

export const SECTION_LABELS = ['1–10', '11–20', '21–30', '31–40', '41–45'];
