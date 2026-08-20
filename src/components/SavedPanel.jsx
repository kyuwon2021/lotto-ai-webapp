import React from 'react';
import SetCard from './SetCard';
import NumberBall from './NumberBall';
import { bestResult, RANK_LABEL } from '../lib/prize';
import { structureScore } from '../lib/predictor';

function MatchSummary({ numbers, draws }) {
  const result = bestResult(numbers, draws);
  if (!result.draw) return null;

  return (
    <div className={`match${result.rank ? ' match--win' : ''}`}>
      <span className="match__head">
        과거 {draws.length}회 대조 · 최고 성적{' '}
        <b>{result.rank ? RANK_LABEL[result.rank] : `${result.matchCount}개 일치`}</b>
      </span>
      <span className="match__body">
        {result.draw.round}회차에서{' '}
        {result.matches.length > 0 ? (
          <span className="match__balls">
            {result.matches.map((n) => (
              <NumberBall key={n} number={n} size="xs" />
            ))}
          </span>
        ) : (
          '일치 번호 없음'
        )}
      </span>
    </div>
  );
}

export default function SavedPanel({ saved, draws, onRemove, onClear }) {
  if (saved.length === 0) {
    return (
      <section className="panel">
        <header className="panel__head">
          <h2>보관함</h2>
          <p>마음에 드는 조합을 저장해 두면 여기 모입니다.</p>
        </header>
        <p className="empty">
          아직 저장한 조합이 없습니다. 예측 탭이나 추첨기 탭에서
          <strong> 보관함에 저장</strong>을 눌러 보세요.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>보관함</h2>
        <p>
          저장한 조합 {saved.length}개. 각 조합이 과거 회차에 나왔다면 몇 등이었을지
          함께 보여줍니다.
        </p>
      </header>

      <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
        전체 비우기
      </button>

      <div className="set-grid">
        {saved.map((entry) => (
          <SetCard
            key={entry.id}
            numbers={entry.numbers}
            score={structureScore(entry.numbers, draws)}
            onRemove={() => onRemove(entry.id)}
            footer={
              <>
                {entry.source && (
                  <span className="set-card__source">{entry.source}</span>
                )}
                <MatchSummary numbers={entry.numbers} draws={draws} />
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
