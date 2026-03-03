import React, { useMemo, useState } from 'react';
import {
  parseLottoData,
  buildAIScores,
  generateMultipleSets,
  getFrequencyMap,
  getRecentFrequencyMap,
} from './ai';
import NumberBall from './components/NumberBall';
import RouletteCanvas from './components/RouletteCanvas';
import FreqHeatmap from './components/FreqHeatmap';

const draws = parseLottoData();

export default function App() {
  const [tab, setTab] = useState('ai');

  const aiScores = useMemo(() => buildAIScores(draws), []);
  const freqMap = useMemo(() => getFrequencyMap(draws), []);
  const recentFreqMap = useMemo(() => getRecentFrequencyMap(draws, 10), []);

  const [aiSets, setAiSets] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [spinIndex, setSpinIndex] = useState(null);
  const [rouletteNumbers, setRouletteNumbers] = useState([]);

  const hotNumbers = useMemo(() => {
    return Object.entries(recentFreqMap)
      .filter(([_, cnt]) => cnt >= 3)
      .map(([n]) => parseInt(n))
      .sort((a, b) => recentFreqMap[b] - recentFreqMap[a]);
  }, [recentFreqMap]);

  const coldNumbers = useMemo(() => {
    return Object.entries(recentFreqMap)
      .filter(([_, cnt]) => cnt === 0)
      .map(([n]) => parseInt(n))
      .sort((a, b) => a - b);
  }, [recentFreqMap]);

  const handleGenerateAI = () => {
    setAiSets(generateMultipleSets(aiScores, 5));
  };

  const startRoulette = () => {
    if (spinning) return;
    setRouletteNumbers([]);
    setSpinning(true);
    setSpinIndex(0);
  };

  const handleSpinEnd = (num) => {
    setRouletteNumbers((prev) => {
      const next = [...prev, num];
      if (next.length < 6) {
        setSpinIndex((idx) => (idx == null ? 0 : idx + 1));
      } else {
        setSpinning(false);
      }
      return next;
    });
  };

  return (
    <div className="app-root">
      <audio id="spin-sound" src="" preload="auto" />
      <audio id="click-sound" src="" preload="auto" />

      <div className="app-shell">
        <header className="app-header">
          <div className="logo-title">
            <span className="logo-dot" />
            <span className="logo-text">Lotto AI Predictor</span>
          </div>
          <div className="subtitle">
            AI 통계 분석 기반 로또 번호 예측기 · {draws.length}회분 데이터
          </div>
        </header>

        <main className="app-main">
          <div className="tabs">
            <button
              className={tab === 'ai' ? 'tab active' : 'tab'}
              onClick={() => setTab('ai')}
            >
              🤖 AI 예측
            </button>
            <button
              className={tab === 'roulette' ? 'tab active' : 'tab'}
              onClick={() => setTab('roulette')}
            >
              🎰 룰렛
            </button>
            <button
              className={tab === 'stats' ? 'tab active' : 'tab'}
              onClick={() => setTab('stats')}
            >
              📊 통계
            </button>
          </div>

          {tab === 'ai' && (
            <section className="panel glass">
              <h2>AI 번호 예측</h2>
              <p className="desc">
                출현 빈도 · 최근 패턴 · 출현 간격 · 동반 출현율을 종합 분석해
                추천 세트 5개를 생성합니다.
              </p>
              <button className="primary-btn" onClick={handleGenerateAI}>
                🤖 5세트 예측하기
              </button>

              {aiSets.length > 0 && (
                <div className="sets-grid">
                  {aiSets.map((set, idx) => (
                    <div key={idx} className="set-card">
                      <div className="set-label">추천 {idx + 1}</div>
                      <div className="balls-row">
                        {set.map((n) => (
                          <NumberBall key={n} number={n} size="normal" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="hotcold-section">
                <div className="hotcold-group">
                  <div className="hc-label hot-label">🔥 HOT 번호 (최근 10회)</div>
                  <div className="balls-row small">
                    {hotNumbers.length > 0 ? (
                      hotNumbers.map((n) => (
                        <NumberBall key={n} number={n} size="small" />
                      ))
                    ) : (
                      <span className="placeholder">해당 없음</span>
                    )}
                  </div>
                </div>
                <div className="hotcold-group">
                  <div className="hc-label cold-label">❄️ COLD 번호 (최근 10회 미출현)</div>
                  <div className="balls-row small">
                    {coldNumbers.length > 0 ? (
                      coldNumbers.slice(0, 15).map((n) => (
                        <NumberBall key={n} number={n} size="small" />
                      ))
                    ) : (
                      <span className="placeholder">해당 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === 'roulette' && (
            <section className="panel glass">
              <h2>3D 룰렛 번호 추첨</h2>
              <p className="desc">
                AI 가중치를 적용한 룰렛으로 6개 번호를 순서대로 추첨합니다.
                이미 뽑힌 번호는 자동으로 제외됩니다.
              </p>
              <div className="roulette-area">
                <RouletteCanvas
                  aiScores={aiScores}
                  onSpinEnd={handleSpinEnd}
                  spinIndex={spinIndex}
                  excludeNumbers={rouletteNumbers}
                />
              </div>
              <button
                className="primary-btn"
                onClick={startRoulette}
                disabled={spinning}
              >
                {spinning
                  ? `추첨 중... (${rouletteNumbers.length + 1}/6)`
                  : '🎰 룰렛 6회 돌려서 번호 뽑기'}
              </button>
              <div className="result-box">
                <div className="result-title">
                  추첨된 번호 ({rouletteNumbers.length}/6)
                </div>
                <div className="balls-row small">
                  {rouletteNumbers.length === 0 ? (
                    <span className="placeholder">
                      아직 추첨된 번호가 없습니다.
                    </span>
                  ) : (
                    [...rouletteNumbers]
                      .sort((a, b) => a - b)
                      .map((n, idx) => (
                        <NumberBall key={idx} number={n} size="normal" />
                      ))
                  )}
                </div>
              </div>
            </section>
          )}

          {tab === 'stats' && (
            <section className="panel glass">
              <h2>번호 출현 빈도 통계</h2>
              <p className="desc">
                총 {draws.length}회 당첨 데이터 기준. 셀이 진할수록 출현 빈도가 높습니다.
              </p>
              <FreqHeatmap freqMap={freqMap} recentFreqMap={recentFreqMap} />
            </section>
          )}

          <section className="panel info">
            <h3>참고</h3>
            <ul>
              <li>
                현재 데이터는 {draws.length}회분 당첨 결과를 기반으로 합니다.
              </li>
              <li>
                실제 로또는 완전한 확률 게임이므로, 이 앱은 엔터테인먼트
                목적으로만 사용해 주세요.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
