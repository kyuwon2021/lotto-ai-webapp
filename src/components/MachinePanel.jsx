import React, { useMemo, useState } from 'react';
import LottoMachine from './LottoMachine';
import NumberBall from './NumberBall';
import SetCard from './SetCard';
import { ALL_NUMBERS } from '../lib/draws';
import { structureScore } from '../lib/predictor';

export default function MachinePanel({ model, draws, savedKeys, onSave }) {
  const [drawn, setDrawn] = useState([]);
  const [running, setRunning] = useState(false);
  const [useAiWeights, setUseAiWeights] = useState(true);
  const [resetToken, setResetToken] = useState(0);

  const weights = useMemo(() => {
    const w = {};
    for (const n of ALL_NUMBERS) {
      w[n] = useAiWeights ? 0.25 + model[n].score * 1.6 : 1;
    }
    return w;
  }, [model, useAiWeights]);

  const handleDrawn = (n) => {
    setDrawn((prev) => {
      const next = [...prev, n];
      if (next.length >= 6) setRunning(false);
      return next;
    });
  };

  const start = () => {
    if (drawn.length >= 6) return;
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setDrawn([]);
    setResetToken((t) => t + 1);
  };

  const complete = drawn.length >= 6;
  const sorted = [...drawn].sort((a, b) => a - b);

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>추첨기</h2>
        <p>
          공 45개가 든 추첨기를 돌려 번호 6개를 하나씩 뽑습니다. 뽑힌 공은
          추첨기에서 빠지므로 번호가 겹치지 않습니다.
        </p>
      </header>

      <div className="machine">
        <LottoMachine
          active={running}
          drawnCount={drawn.length}
          weights={weights}
          onDrawn={handleDrawn}
          resetToken={resetToken}
        />

        <div className="tray" aria-live="polite">
          <span className="tray__label">
            추첨 결과 <b>{drawn.length}</b> / 6
          </span>
          <div className="tray__slots">
            {Array.from({ length: 6 }, (_, i) =>
              drawn[i] != null ? (
                <NumberBall key={i} number={drawn[i]} size="md" />
              ) : (
                <span key={i} className="tray__empty" aria-hidden="true" />
              )
            )}
          </div>
        </div>
      </div>

      <div className="machine__controls">
        <button
          type="button"
          className="btn btn--primary"
          onClick={start}
          disabled={running || complete}
        >
          {running
            ? `추첨 중… (${drawn.length + 1}번째)`
            : complete
              ? '추첨 완료'
              : drawn.length > 0
                ? '이어서 추첨'
                : '추첨 시작'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={reset}
          disabled={running || drawn.length === 0}
        >
          다시 하기
        </button>

        <label className="switch">
          <input
            type="checkbox"
            checked={useAiWeights}
            onChange={(e) => setUseAiWeights(e.target.checked)}
            disabled={running}
          />
          <span>AI 가중치 적용</span>
        </label>
      </div>

      <p className="field__hint">
        {useAiWeights
          ? '모델 점수가 높은 공이 조금 더 잘 뽑히도록 가중치를 줍니다.'
          : '모든 공이 완전히 같은 확률로 뽑힙니다.'}
      </p>

      {complete && (
        <div className="machine__result">
          <SetCard
            numbers={sorted}
            score={structureScore(sorted, draws)}
            saved={savedKeys.has(sorted.join(','))}
            onSave={() => onSave(sorted, '추첨기')}
          />
        </div>
      )}
    </section>
  );
}
