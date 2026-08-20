/**
 * 로또 6/45 일정 계산.
 * 판매 마감 토요일 20:00 KST, 추첨 20:35 KST.
 * KST = UTC+9 이므로 UTC 기준 토요일 11:00 / 11:35 이다.
 */

const SATURDAY = 6;

function nextSaturdayAtUtc(now, utcHour, utcMinute) {
  const target = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      utcHour,
      utcMinute,
      0,
      0
    )
  );
  target.setUTCDate(target.getUTCDate() + ((SATURDAY - now.getUTCDay() + 7) % 7));
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }
  return target;
}

/** 다음 판매 마감 시각 (토 20:00 KST) */
export const nextSaleDeadline = (now = new Date()) =>
  nextSaturdayAtUtc(now, 11, 0);

/** 다음 추첨 시각 (토 20:35 KST) */
export const nextDrawTime = (now = new Date()) =>
  nextSaturdayAtUtc(now, 11, 35);

/** 남은 시간을 일/시/분/초로 쪼갠다. */
export function breakdown(target, now = new Date()) {
  const ms = Math.max(target.getTime() - now.getTime(), 0);
  const total = Math.floor(ms / 1000);
  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

/** "8월 23일 (토)" 형태의 KST 표기 */
export function formatKst(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}
