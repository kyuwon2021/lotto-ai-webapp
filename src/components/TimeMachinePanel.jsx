import React, { useEffect, useRef, useState } from 'react';
import NumberBall from './NumberBall';
import NumberPicker from './NumberPicker';
import { simulate, baselineSimulation, formatKrw, TICKET_PRICE, RANK_ORDER } from '../lib/simulate';
import { RANK_LABEL } from '../lib/prize';

const RUN_MS = 2200;

export default function TimeMachinePanel({ draws, saved }) {
  const [picked, setPicked] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [cursor, setCursor] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const rafRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const sorted = [...picked].sort((a, b) => a - b);
  const ready = picked.length === 6;

  const run = () => {
    if (!ready) return;
    const result = simulate(sorted, draws);
    setOutcome(result);
    setBaseline(baselineSimulation(draws, 40));
    setPhase('running');
    setCursor(0);

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / RUN_MS, 1);
      // 뒤로 갈수록 천천히 멈추도록
      const eased = 1 - Math.pow(1 - progress, 2.5);
      setCursor(Math.floor(eased * draws.length));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCursor(draws.length);
        setPhase('done');
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase('idle');
    setOutcome(null);
    setCursor(0);
  };

  // 진행 중에는 그 시점까지의 누적을 보여 준다.
  const live = outcome
    ? outcome.results.slice(0, cursor).reduce(
        (acc, r) => {
          if (r.rank) {
            acc.byRank[r.rank] += 1;
            acc.hits += 1;
          }
          return acc;
        },
        { byRank: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, hits: 0 }
      )
    : null;

  const currentRound = outcome?.results[Math.max(cursor - 1, 0)]?.round;

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>타임머신</h2>
        <p>
          이 번호로 <b>{draws.length}회</b> 내내 샀다면 지금 얼마가 됐을까요?{' '}
          {draws[0].round}회부터 {draws[draws.length - 1].round}회까지 전부
          대조해 봅니다.
        </p>
      </header>

      {phase === 'idle' && (
        <>
          <NumberPicker
            picked={picked}
            onChange={setPicked}
            saved={saved}
            label="타임머신에 넣을 번호"
          />
          <button type="button" className="btn btn--gold btn--lg" onClick={run} disabled={!ready}>
            {ready ? `${draws.length}회 돌려보기` : `번호 ${6 - picked.length}개 더`}
          </button>
        </>
      )}

      {phase !== 'idle' && outcome && (
        <div className="tm">
          <div className="tm__balls">
            {sorted.map((n) => (
              <NumberBall key={n} number={n} size="md" />
            ))}
          </div>

          <div className="tm__meter">
            <div className="tm__round">
              {phase === 'running' ? `${currentRound}회 확인 중…` : '전 회차 완료'}
            </div>
            <div className="tm__bar">
              <span style={{ width: `${(cursor / draws.length) * 100}%` }} />
            </div>
            <div className="tm__count">
              {cursor.toLocaleString()} / {draws.length.toLocaleString()}회
            </div>
          </div>

          <div className="tm__ranks">
            {RANK_ORDER.map((r) => {
              const n = live.byRank[r];
              return (
                <div key={r} className={`tm__rank${n > 0 ? ' is-hit' : ''}`}>
                  <span className="tm__rank-label">{RANK_LABEL[r]}</span>
                  <span className="tm__rank-count">{n}</span>
                </div>
              );
            })}
          </div>

          {phase === 'done' && (
            <div className="tm__result">
              <div className="tm__money">
                <div className="tm__money-row">
                  <span>산 돈</span>
                  <b>{formatKrw(outcome.spent)}</b>
                </div>
                <div className="tm__money-row">
                  <span>받은 돈</span>
                  <b className="is-won">{formatKrw(outcome.won)}</b>
                </div>
                <div
                  className={`tm__money-row tm__money-row--net${
                    outcome.net >= 0 ? ' is-plus' : ' is-minus'
                  }`}
                >
                  <span>{outcome.net >= 0 ? '순이익' : '순손실'}</span>
                  <b>{formatKrw(outcome.net)}</b>
                </div>
              </div>

              <p className="tm__line">
                {outcome.best ? (
                  <>
                    최고 성적은 <b>{outcome.best.round}회 {RANK_LABEL[outcome.best.rank]}</b>
                    입니다. 당첨된 회차는 {Object.values(outcome.byRank).reduce((a, b) => a + b, 0)}번,
                    적중률 {(outcome.hitRate * 100).toFixed(1)}%.
                  </>
                ) : (
                  <>{draws.length}회 동안 한 번도 당첨되지 않았습니다.</>
                )}
              </p>

              {baseline != null && (
                <p className="tm__line tm__line--dim">
                  무작위 조합 40개의 평균 당첨금은 {formatKrw(baseline)}였습니다.
                  내 번호는{' '}
                  <b>
                    {outcome.won > baseline
                      ? `평균보다 ${formatKrw(outcome.won - baseline)} 높음`
                      : outcome.won < baseline
                        ? `평균보다 ${formatKrw(baseline - outcome.won)} 낮음`
                        : '평균과 같음'}
                  </b>
                  .
                </p>
              )}

              <p className="tm__disclaimer">
                1~3등 당첨금은 회차마다 달라지므로 최근 평균값(1등 20억, 2등 5,500만,
                3등 150만)으로 계산한 추정치입니다. 4·5등은 실제 고정 금액입니다.
                한 게임 {TICKET_PRICE.toLocaleString()}원 기준.
              </p>

              <div className="tm__actions">
                <button type="button" className="btn btn--gold btn--sm" onClick={reset}>
                  다른 번호로 해보기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
