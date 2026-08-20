import React from 'react';

/**
 * 값 비교용 가로 막대 차트.
 * items: [{ label, count, color? }]
 */
export default function BarChart({ items, unit = '회', accent = '#38bdf8' }) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="bars">
      {items.map(({ label, count, color }) => (
        <li key={label} className="bars__row">
          <span className="bars__label">{label}</span>
          <span className="bars__track">
            <span
              className="bars__fill"
              style={{
                width: `${Math.max((count / max) * 100, count > 0 ? 3 : 0)}%`,
                background: color ?? accent,
              }}
            />
          </span>
          <span className="bars__value">
            {count}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}
