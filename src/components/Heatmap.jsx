import React from 'react';
import { ALL_NUMBERS } from '../lib/draws';
import { ballColor, rgbChannels, COLOR_LEGEND } from '../lib/colors';

export default function Heatmap({ freq, recentFreq, droughtMap, recentWindow }) {
  const values = Object.values(freq);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  return (
    <div className="heatmap">
      <div className="legend">
        {COLOR_LEGEND.map(({ label, color }) => (
          <span key={label} className="legend__item">
            <i className="legend__dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      <div className="heatmap__grid">
        {ALL_NUMBERS.map((n) => {
          const hits = freq[n] ?? 0;
          const recent = recentFreq[n] ?? 0;
          const gap = droughtMap[n] ?? 0;
          const intensity = (hits - min) / span;
          const channels = rgbChannels(ballColor(n));
          const hot = recent >= 3;
          const cold = recent === 0;

          return (
            <div
              key={n}
              className={`cell${hot ? ' cell--hot' : ''}${cold ? ' cell--cold' : ''}`}
              style={{
                background: `rgba(${channels}, ${(0.14 + intensity * 0.7).toFixed(3)})`,
                borderColor: `rgba(${channels}, 0.55)`,
              }}
              title={`${n}번 · 전체 ${hits}회 · 최근 ${recentWindow}회 중 ${recent}회 · ${gap}회째 미출현`}
            >
              <span className="cell__num">{n}</span>
              <span className="cell__hits">{hits}</span>
              {(hot || cold) && (
                <span className="cell__badge">{hot ? '🔥' : '❄️'}</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="heatmap__note">
        칸이 진할수록 전체 출현이 많습니다. 🔥 최근 {recentWindow}회 중 3회 이상,
        ❄️ 최근 {recentWindow}회 미출현.
      </p>
    </div>
  );
}
