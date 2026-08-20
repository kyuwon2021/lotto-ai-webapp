import React, { useMemo, useState } from 'react';
import NumberBall from './NumberBall';
import AdSlot from './AdSlot';
import { ALL_NUMBERS } from '../lib/draws';
import { rankAgainst, bestResult, RANK_LABEL } from '../lib/prize';
import { shareNumbers } from '../lib/share';

export default function CheckPanel({ draws, saved }) {
  const latest = draws[draws.length - 1];
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  const toggle = (n) => {
    setResult(null);
    setPicked((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 6) return prev;
      return [...prev, n];
    });
  };

  const sorted = useMemo(() => [...picked].sort((a, b) => a - b), [picked]);
  const ready = picked.length === 6;

  const handleCheck = () => {
    if (!ready) return;
    setResult({
      latest: rankAgainst(sorted, latest),
      best: bestResult(sorted, draws),
    });
  };

  const handleShare = async () => {
    const status = await shareNumbers(sorted);
    if (status === 'copied') setToast('링크를 복사했습니다');
    else if (status === 'failed') setToast('공유를 취소했습니다');
    if (status !== 'shared') setTimeout(() => setToast(''), 2000);
  };

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>당첨 확인</h2>
        <p>
          번호 6개를 고르면 최신 회차({latest.round}회) 결과와, 과거 전체 회차에서의
          최고 성적을 함께 알려 드립니다.
        </p>
      </header>

      <div className="latest">
        <span className="latest__label">{latest.round}회 당첨 번호</span>
        <div className="latest__balls">
          {latest.numbers.map((n) => (
            <NumberBall key={n} number={n} size="sm" />
          ))}
          <span className="latest__plus">+</span>
          <NumberBall number={latest.bonus} size="sm" />
        </div>
      </div>

      <div className="field">
        <span className="field__label">
          내 번호 고르기 <b className="field__count">{picked.length}/6</b>
        </span>
        <div className="picker">
          <div className="picker__grid">
            {ALL_NUMBERS.map((n) => (
              <NumberBall
                key={n}
                number={n}
                size="sm"
                dimmed={!picked.includes(n)}
                onClick={() => toggle(n)}
                title={`${n}번`}
              />
            ))}
          </div>
          <div className="picker__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setPicked([]);
                setResult(null);
              }}
              disabled={picked.length === 0}
            >
              지우기
            </button>
            {saved.length > 0 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setPicked(saved[0].numbers);
                  setResult(null);
                }}
              >
                보관함에서 가져오기
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--gold"
        onClick={handleCheck}
        disabled={!ready}
      >
        {ready ? '결과 확인하기' : `번호 ${6 - picked.length}개 더 골라 주세요`}
      </button>

      {result && (
        <div className="check-result">
          <div
            className={`check-result__main${result.latest.rank ? ' is-win' : ''}`}
          >
            <span className="check-result__round">{latest.round}회 결과</span>
            <strong className="check-result__rank">
              {result.latest.rank
                ? RANK_LABEL[result.latest.rank]
                : `${result.latest.matchCount}개 일치 · 낙첨`}
            </strong>
            <div className="check-result__balls">
              {sorted.map((n) => (
                <NumberBall
                  key={n}
                  number={n}
                  size="md"
                  highlight={result.latest.matches.includes(n)}
                  dimmed={!result.latest.matches.includes(n)}
                />
              ))}
            </div>
            {result.latest.hasBonus && (
              <span className="check-result__bonus">보너스 번호 포함</span>
            )}
          </div>

          <p className="check-result__history">
            과거 {draws.length}회 전체와 대조하면 최고 성적은{' '}
            <b>
              {result.best.rank
                ? `${result.best.draw.round}회 ${RANK_LABEL[result.best.rank]}`
                : `${result.best.matchCount}개 일치`}
            </b>
            였습니다.
          </p>

          <div className="check-result__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleShare}>
              번호 공유하기
            </button>
            {toast && <span className="toast">{toast}</span>}
          </div>
        </div>
      )}

      <AdSlot slot={import.meta.env.VITE_AD_SLOT_CHECK} minHeight={250} />
    </section>
  );
}
