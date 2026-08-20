import React, { useEffect, useState } from 'react';
import { nextSaleDeadline, nextDrawTime, breakdown, formatKst } from '../lib/schedule';

const pad = (n) => String(n).padStart(2, '0');

function Countdown() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = nextSaleDeadline(now);
  const left = breakdown(deadline, now);

  const units = [
    { value: left.days, label: '일' },
    { value: left.hours, label: '시간' },
    { value: left.minutes, label: '분' },
    { value: left.seconds, label: '초' },
  ];

  return (
    <div className="countdown">
      <span className="countdown__title">
        이번 회차 판매 마감까지
        <b> {formatKst(deadline)} 20:00</b>
      </span>
      <div className="countdown__row">
        {units.map(({ value, label }) => (
          <div key={label} className="countdown__unit">
            <span className="countdown__num">{pad(value)}</span>
            <span className="countdown__label">{label}</span>
          </div>
        ))}
      </div>
      <span className="countdown__note">
        추첨 {formatKst(nextDrawTime(now))} 20:35
      </span>
    </div>
  );
}

export default function Hero({ onPrimary, onSecondary, drawCount }) {
  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />

      <p className="hero__eyebrow">설치 없음 · 로그인 없음 · 완전 무료</p>

      <h1 className="hero__title">
        이번주 <span className="hero__accent">로또 번호</span>
        <br />
        1초 만에 받아가세요
      </h1>

      <p className="hero__sub">
        과거 <b>{drawCount}회분</b> 당첨 데이터를 분석해 조합을 만들어 드립니다.
        번호 입력도, 전화번호도 필요 없습니다.
      </p>

      <Countdown />

      <div className="hero__cta">
        <button type="button" className="btn btn--gold btn--lg" onClick={onPrimary}>
          번호 받기
        </button>
        <button type="button" className="btn btn--ghost btn--lg" onClick={onSecondary}>
          당첨 확인
        </button>
      </div>

      <ul className="hero__marks">
        <li>개인정보 수집 안 함</li>
        <li>결제 없음</li>
        <li>브라우저에만 저장</li>
      </ul>
    </section>
  );
}
