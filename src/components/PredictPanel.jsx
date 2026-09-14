import React, { useState } from 'react';
import NumberBall from './NumberBall';
import SetCard from './SetCard';
import AdSlot from './AdSlot';
import { ALL_NUMBERS } from '../lib/draws';
import { STRATEGIES, generateSets, structureScore, keyNumbers } from '../lib/predictor';
import { shareNumbers } from '../lib/share';
import { spreadWeights, popularityIndex, popularityGrade, estimatedSplit } from '../lib/payout';

const COUNTS = [1, 3, 5, 10];

export default function PredictPanel({ model, draws, avgSum, savedKeys, onSave }) {
  const [strategy, setStrategy] = useState('ai');
  const [count, setCount] = useState(5);
  const [excluded, setExcluded] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [sets, setSets] = useState([]);
  const [toast, setToast] = useState('');

  const handleShare = async (numbers) => {
    const status = await shareNumbers(numbers);
    if (status === 'shared') return;
    setToast(status === 'copied' ? '번호를 복사했습니다' : '공유를 취소했습니다');
    setTimeout(() => setToast(''), 2000);
  };

  const toggleExcluded = (n) =>
    setExcluded((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const handleGenerate = () => {
    setSets(
      generateSets(
        {
          model,
          strategy,
          exclude: excluded,
          targetSum: Math.round(avgSum),
          spread: spreadWeights(),
          scoreCombo: (c) => popularityIndex(c, draws),
        },
        count
      )
    );
  };

  const tooManyExcluded = excluded.length > 39;

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>번호 예측</h2>
        <p>
          {draws.length}회분 데이터를 분석해 조합을 만듭니다. 전략에 따라 어떤
          통계를 더 크게 볼지 달라집니다.
        </p>
      </header>

      <div className="field">
        <span className="field__label">생성 전략</span>
        <div className="chips">
          {Object.values(STRATEGIES).map((s) => (
            <button
              key={s.key}
              type="button"
              className={`chip${strategy === s.key ? ' chip--on' : ''}`}
              onClick={() => setStrategy(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="field__hint">{STRATEGIES[strategy].hint}</p>
      </div>

      <div className="field">
        <span className="field__label">생성 개수</span>
        <div className="chips">
          {COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${count === c ? ' chip--on' : ''}`}
              onClick={() => setCount(c)}
            >
              {c}조합
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <button
          type="button"
          className="field__toggle"
          onClick={() => setShowPicker((v) => !v)}
          aria-expanded={showPicker}
        >
          제외할 번호 {excluded.length > 0 && `(${excluded.length}개)`}
          <span aria-hidden="true">{showPicker ? '▲' : '▼'}</span>
        </button>

        {showPicker && (
          <div className="picker">
            <div className="picker__grid">
              {ALL_NUMBERS.map((n) => (
                <NumberBall
                  key={n}
                  number={n}
                  size="sm"
                  dimmed={excluded.includes(n)}
                  onClick={() => toggleExcluded(n)}
                  title={excluded.includes(n) ? '제외됨 — 클릭해서 해제' : '클릭해서 제외'}
                />
              ))}
            </div>
            {excluded.length > 0 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setExcluded([])}
              >
                제외 전체 해제
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn--gold"
        onClick={handleGenerate}
        disabled={tooManyExcluded}
      >
        번호 생성하기
      </button>
      {toast && <span className="toast">{toast}</span>}
      {tooManyExcluded && (
        <p className="field__hint field__hint--warn">
          제외한 번호가 너무 많습니다. 최소 6개는 남겨 주세요.
        </p>
      )}

      {sets.length > 0 && (
        <p className="field__hint">
          <span className="hint-ring" aria-hidden="true" /> 표시는 그 조합에서 모델
          점수가 가장 높은 번호입니다. 균형도는 조합의 구조가 과거 당첨 조합과
          얼마나 비슷한지를 나타냅니다.
        </p>
      )}

      {sets.length > 0 && (
        <div className="set-grid">
          {sets.map((numbers, i) => {
            const pop = popularityIndex(numbers, draws);
            const grade = popularityGrade(pop);
            return (
              <SetCard
                key={numbers.join('-')}
                numbers={numbers}
                index={i}
                score={structureScore(numbers, draws)}
                keyNums={keyNumbers(numbers, model)}
                saved={savedKeys.has(numbers.join(','))}
                onSave={() => onSave(numbers, STRATEGIES[strategy].label)}
                onShare={handleShare}
                footer={
                  <div className={`pop pop--${grade.tone}`}>
                    <span className="pop__grade">{grade.label}</span>
                    <span className="pop__detail">
                      1등 시 예상 분배 {estimatedSplit(pop).toFixed(1)}명
                    </span>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {sets.length > 0 && (
        <AdSlot slot={import.meta.env.VITE_AD_SLOT_PREDICT} minHeight={250} />
      )}

      {sets.length === 0 && (
        <p className="empty">
          전략을 고르고 <strong>번호 생성하기</strong>를 눌러 주세요.
        </p>
      )}
    </section>
  );
}
