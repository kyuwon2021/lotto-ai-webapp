import React from 'react';
import NumberBall from './NumberBall';
import { ALL_NUMBERS } from '../lib/draws';

/** 45개 중 6개를 고르는 공용 선택기. */
export default function NumberPicker({
  picked,
  onChange,
  saved = [],
  label = '번호 고르기',
  max = 6,
}) {
  const toggle = (n) => {
    if (picked.includes(n)) {
      onChange(picked.filter((x) => x !== n));
    } else if (picked.length < max) {
      onChange([...picked, n]);
    }
  };

  const randomFill = () => {
    const pool = ALL_NUMBERS.filter((n) => !picked.includes(n));
    const next = [...picked];
    while (next.length < max && pool.length) {
      next.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    }
    onChange(next);
  };

  return (
    <div className="field">
      <span className="field__label">
        {label} <b className="field__count">{picked.length}/{max}</b>
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
          <button type="button" className="btn btn--ghost btn--sm" onClick={randomFill}>
            자동 채우기
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onChange([])}
            disabled={picked.length === 0}
          >
            지우기
          </button>
          {saved.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onChange(saved[0].numbers)}
            >
              보관함에서
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
