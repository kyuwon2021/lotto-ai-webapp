import React from 'react';
import NumberBall from './NumberBall';
import { describeSet } from '../lib/stats';

export default function SetCard({
  numbers,
  index,
  score,
  keyNums = [],
  saved = false,
  onSave,
  onRemove,
  footer,
}) {
  const info = describeSet(numbers);
  const spread = info.sections.filter((c) => c > 0).length;

  return (
    <article className="set-card">
      <div className="set-card__head">
        <span className="set-card__index">
          {index != null ? `조합 ${index + 1}` : '저장한 조합'}
        </span>
        {score != null && (
          <span
            className="set-card__score"
            title="과거 당첨 조합들과 구조가 얼마나 비슷한지 (당첨 확률 아님)"
          >
            균형도 {score}
          </span>
        )}
      </div>

      <div className="set-card__balls">
        {numbers.map((n) => (
          <NumberBall
            key={n}
            number={n}
            size="md"
            highlight={keyNums.includes(n)}
            title={keyNums.includes(n) ? '모델 점수가 높은 번호' : undefined}
          />
        ))}
      </div>

      <dl className="set-card__meta">
        <div>
          <dt>합계</dt>
          <dd>{info.sum}</dd>
        </div>
        <div>
          <dt>홀짝</dt>
          <dd>
            {info.odd}:{info.even}
          </dd>
        </div>
        <div>
          <dt>구간</dt>
          <dd>{spread}/5</dd>
        </div>
        <div>
          <dt>연번</dt>
          <dd>{info.consecutive}</dd>
        </div>
      </dl>

      {footer}

      {(onSave || onRemove) && (
        <div className="set-card__actions">
          {onSave && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onSave(numbers)}
              disabled={saved}
            >
              {saved ? '저장됨' : '보관함에 저장'}
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--danger"
              onClick={onRemove}
            >
              삭제
            </button>
          )}
        </div>
      )}
    </article>
  );
}
