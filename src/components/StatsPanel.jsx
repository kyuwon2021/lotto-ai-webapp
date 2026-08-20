import React, { useMemo, useState } from 'react';
import Heatmap from './Heatmap';
import BarChart from './BarChart';
import NumberBall from './NumberBall';
import { SECTION_LABELS } from '../lib/draws';
import { ballColor } from '../lib/colors';
import {
  frequency,
  recentFrequency,
  drought,
  sumDistribution,
  oddEvenDistribution,
  sectionDistribution,
  topPairs,
  averageSum,
} from '../lib/stats';

const WINDOWS = [5, 10, 20];

export default function StatsPanel({ draws }) {
  const [windowSize, setWindowSize] = useState(10);

  const freq = useMemo(() => frequency(draws), [draws]);
  const droughtMap = useMemo(() => drought(draws), [draws]);
  const recentFreq = useMemo(
    () => recentFrequency(draws, windowSize),
    [draws, windowSize]
  );

  const ranked = useMemo(
    () =>
      Object.entries(freq)
        .map(([n, count]) => ({ n: Number(n), count }))
        .sort((a, b) => b.count - a.count || a.n - b.n),
    [freq]
  );

  const sections = useMemo(() => sectionDistribution(draws), [draws]);
  const recentDraws = useMemo(() => [...draws].reverse().slice(0, 8), [draws]);
  const pairs = useMemo(() => topPairs(draws, 6), [draws]);
  const avg = useMemo(() => averageSum(draws), [draws]);

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>통계</h2>
        <p>
          {draws.length}회분({draws[0]?.round}–{draws[draws.length - 1]?.round}회)
          당첨 번호를 집계했습니다. 회차 평균 합계는 {avg.toFixed(1)}입니다.
        </p>
      </header>

      <div className="field">
        <span className="field__label">최근 흐름 기준</span>
        <div className="chips">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              className={`chip${windowSize === w ? ' chip--on' : ''}`}
              onClick={() => setWindowSize(w)}
            >
              최근 {w}회
            </button>
          ))}
        </div>
      </div>

      <Heatmap
        freq={freq}
        recentFreq={recentFreq}
        droughtMap={droughtMap}
        recentWindow={windowSize}
      />

      <div className="stat-grid">
        <div className="card">
          <h3>많이 나온 번호</h3>
          <ol className="rank-list">
            {ranked.slice(0, 6).map(({ n, count }, i) => (
              <li key={n}>
                <span className="rank-list__pos">{i + 1}</span>
                <NumberBall number={n} size="sm" />
                <span className="rank-list__bar">
                  <span
                    style={{
                      width: `${(count / ranked[0].count) * 100}%`,
                      background: ballColor(n),
                    }}
                  />
                </span>
                <span className="rank-list__val">{count}회</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3>오래 안 나온 번호</h3>
          <ol className="rank-list">
            {Object.entries(droughtMap)
              .map(([n, gap]) => ({ n: Number(n), gap }))
              .sort((a, b) => b.gap - a.gap || a.n - b.n)
              .slice(0, 6)
              .map(({ n, gap }, i) => (
                <li key={n}>
                  <span className="rank-list__pos">{i + 1}</span>
                  <NumberBall number={n} size="sm" />
                  <span className="rank-list__bar">
                    <span
                      style={{
                        width: `${Math.min((gap / draws.length) * 100, 100)}%`,
                        background: ballColor(n),
                      }}
                    />
                  </span>
                  <span className="rank-list__val">{gap}회째</span>
                </li>
              ))}
          </ol>
        </div>

        <div className="card">
          <h3>구간별 출현</h3>
          <BarChart
            items={SECTION_LABELS.map((label, i) => ({
              label,
              count: sections[i],
              color: ballColor(i * 10 + 1),
            }))}
          />
        </div>

        <div className="card">
          <h3>홀짝 비율</h3>
          <BarChart items={oddEvenDistribution(draws)} accent="#a78bfa" />
        </div>

        <div className="card">
          <h3>당첨 번호 합계 분포</h3>
          <BarChart items={sumDistribution(draws, 20)} accent="#34d399" />
        </div>

        <div className="card">
          <h3>자주 함께 나온 짝</h3>
          <ul className="pair-list">
            {pairs.map(({ a, b, count }) => (
              <li key={`${a}-${b}`}>
                <NumberBall number={a} size="xs" />
                <NumberBall number={b} size="xs" />
                <span className="pair-list__val">{count}회 동반</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>최근 당첨 번호</h3>
        <div className="draw-list">
          {recentDraws.map((d) => (
            <div key={d.round} className="draw-list__row">
              <span className="draw-list__round">{d.round}회</span>
              <div className="draw-list__balls">
                {d.numbers.map((n) => (
                  <NumberBall key={n} number={n} size="sm" />
                ))}
                <span className="draw-list__plus" aria-label="보너스">
                  +
                </span>
                <NumberBall number={d.bonus} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
