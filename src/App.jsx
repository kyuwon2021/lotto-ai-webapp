import React, { useMemo, useState } from 'react';
import { parseLottoData, buildAIScores, generateAISet } from './ai';
import NumberBall from './components/NumberBall';
import RouletteCanvas from './components/RouletteCanvas';

const draws = parseLottoData();

export default function App() {
  const [tab, setTab] = useState('ai');
  const aiScores = useMemo(() => buildAIScores(draws), []);
  const [aiNumbers, setAiNumbers] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [spinIndex, setSpinIndex] = useState(null);
  const [rouletteNumbers, setRouletteNumbers] = useState([]);

  const handleGenerateAI = () => {
    const nums = generateAISet(aiScores);
    setAiNumbers(nums);
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
      {/* 사운드 파일은 나중에 /public/sounds 에 추가해서 src 경로만 채우면 됩니다. */}
      <audio id="spin-sound" src="" preload="auto" />
      <audio id="click-sound" src="" preload="auto" />

      <div className="app-shell">
        <header className="app-header">
          <div className="logo-title">
            <span className="logo-dot" />
            <span className="logo-text">Lotto AI Roulette</span>
          </div>
          <div className="subtitle">
            AI 기반 통계 + 3D 룰렛 스타일 번호 생성기
          </div>
        </header>

        <main className="app-main">
          <div className="tabs">
            <button
              className={tab === 'ai' ? 'tab active' : 'tab'}
              onClick={() => setTab('ai')}
            >
              🤖 AI 추천
            </button>
            <button
              className={tab === 'roulette' ? 'tab active' : 'tab'}
              onClick={() => setTab('roulette')}
            >
              🎰 룰렛 게임
            </button>
          </div>

          {tab === 'ai' && (
            <section className="panel glass">
              <h2>AI 통계 기반 번호 추천</h2>
              <p className="desc">
                최근 패턴 · 출현 빈도 · 간격 · 상관도 등을 종합 분석해 6개 번호를
                추천합니다.
              </p>
              <button className="primary-btn" onClick={handleGenerateAI}>
                🤖 AI 번호 생성하기
              </button>
              {aiNumbers.length > 0 && (
                <div className="balls-row">
                  {aiNumbers.map((n) => (
                    <NumberBall key={n} number={n} size="large" />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'roulette' && (
            <section className="panel glass">
              <h2>3D 룰렛 스타일 번호 추첨</h2>
              <p className="desc">
                AI 가중치를 적용한 룰렛을 6번 돌려 최종 번호를 추첨합니다.
                (AI 추천 번호가 조금 더 잘 나오는 구조입니다.)
              </p>
              <div className="roulette-area">
                <RouletteCanvas
                  aiScores={aiScores}
                  onSpinEnd={handleSpinEnd}
                  spinIndex={spinIndex}
                />
              </div>
              <button
                className="primary-btn"
                onClick={startRoulette}
                disabled={spinning}
              >
                {spinning ? '추첨 진행 중...' : '🎰 룰렛 6회 돌려서 번호 뽑기'}
              </button>
              <div className="result-box">
                <div className="result-title">현재까지 추첨된 번호</div>
                <div className="balls-row small">
                  {rouletteNumbers.length === 0 && (
                    <span className="placeholder">
                      아직 추첨된 번호가 없습니다.
                    </span>
                  )}
                  {rouletteNumbers.map((n, idx) => (
                    <NumberBall key={idx} number={n} size="normal" />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="panel info">
            <h3>참고</h3>
            <ul>
              <li>
                현재 데이터는 {draws.length}회분 당첨 결과를 기반으로 합니다.
              </li>
              <li>
                실제 로또는 완전한 확률 게임이므로, 이 앱은 참고용
                엔터테인먼트로 사용해 주세요.
              </li>
              <li>
                구슬 사운드를 사용하려면 <code>/public/sounds</code> 폴더에
                효과음 파일을 추가하고 <code>App.jsx</code> 의 오디오 경로를
                수정하면 됩니다.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
