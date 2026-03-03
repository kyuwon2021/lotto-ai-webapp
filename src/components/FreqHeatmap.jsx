import React from 'react';

const getBallColorRgb = (num) => {
  if (num <= 10) return '250,204,21';   // yellow
  if (num <= 20) return '59,130,246';   // blue
  if (num <= 30) return '239,68,68';    // red
  if (num <= 40) return '107,114,128';  // gray
  return '34,197,94';                   // green
};

export default function FreqHeatmap({ freqMap, recentFreqMap }) {
  const freqValues = Object.values(freqMap);
  const maxFreq = Math.max(...freqValues);
  const minFreq = Math.min(...freqValues);

  const sortedByFreq = Object.entries(freqMap)
    .map(([num, cnt]) => ({ num: parseInt(num), cnt }))
    .sort((a, b) => b.cnt - a.cnt);

  return (
    <div>
      <div className="color-legend">
        {[['1-10', '250,204,21'], ['11-20', '59,130,246'], ['21-30', '239,68,68'], ['31-40', '107,114,128'], ['41-45', '34,197,94']].map(([range, rgb]) => (
          <div key={range} className="color-legend-item">
            <span className="color-dot" style={{ background: `rgb(${rgb})` }} />
            <span>{range}</span>
          </div>
        ))}
      </div>

      <div className="heatmap-grid">
        {Array.from({ length: 45 }, (_, i) => i + 1).map(num => {
          const freq = freqMap[num] || 0;
          const recentFreq = recentFreqMap[num] || 0;
          const intensity = maxFreq > minFreq
            ? (freq - minFreq) / (maxFreq - minFreq)
            : 0.5;
          const rgb = getBallColorRgb(num);
          const alpha = 0.15 + intensity * 0.75;
          const bg = `rgba(${rgb}, ${alpha})`;
          const border = `rgba(${rgb}, 0.5)`;
          const isHot = recentFreq >= 3;
          const isCold = recentFreq === 0;

          return (
            <div
              key={num}
              className={`heatmap-cell${isHot ? ' is-hot' : ''}${isCold ? ' is-cold' : ''}`}
              style={{ background: bg, borderColor: border }}
              title={`번호 ${num}: 전체 ${freq}회 | 최근 10회: ${recentFreq}회`}
            >
              <div className="hm-num">{num}</div>
              <div className="hm-freq">{freq}회</div>
              {(isHot || isCold) && (
                <span className="hm-badge">{isHot ? '🔥' : '❄️'}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="hm-legend-row">
        <span className="hm-legend-item">🔥 최근 10회 중 3회+ 출현 (핫)</span>
        <span className="hm-legend-item">❄️ 최근 10회 미출현 (콜드)</span>
        <span className="hm-legend-item">진할수록 전체 출현 빈도 높음</span>
      </div>

      <div className="top-numbers">
        <div className="top-section">
          <div className="top-title">출현 빈도 상위 10</div>
          <div className="top-list">
            {sortedByFreq.slice(0, 10).map(({ num, cnt }, i) => {
              const rgb = getBallColorRgb(num);
              return (
                <div key={num} className="top-item">
                  <span className="top-rank">#{i + 1}</span>
                  <span
                    className="top-ball"
                    style={{ background: `rgb(${rgb})` }}
                  >
                    {num}
                  </span>
                  <span className="top-cnt">{cnt}회</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="top-section">
          <div className="top-title">출현 빈도 하위 10</div>
          <div className="top-list">
            {sortedByFreq.slice(-10).reverse().map(({ num, cnt }, i) => {
              const rgb = getBallColorRgb(num);
              return (
                <div key={num} className="top-item">
                  <span className="top-rank">#{i + 1}</span>
                  <span
                    className="top-ball"
                    style={{ background: `rgb(${rgb})` }}
                  >
                    {num}
                  </span>
                  <span className="top-cnt">{cnt}회</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
