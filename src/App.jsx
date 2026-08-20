import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PredictPanel from './components/PredictPanel';
import MachinePanel from './components/MachinePanel';
import StatsPanel from './components/StatsPanel';
import SavedPanel from './components/SavedPanel';
import { parseDraws } from './lib/draws';
import { buildModel } from './lib/predictor';
import { averageSum } from './lib/stats';
import { loadSets, addSet, removeSet, clearSets } from './lib/storage';

const TABS = [
  { key: 'predict', label: '예측' },
  { key: 'machine', label: '추첨기' },
  { key: 'stats', label: '통계' },
  { key: 'saved', label: '보관함' },
];

const draws = parseDraws();

export default function App() {
  const [tab, setTab] = useState('predict');
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(loadSets());
  }, []);

  const { model, weights } = useMemo(() => buildModel(draws), []);
  const avgSum = useMemo(() => averageSum(draws), []);
  const savedKeys = useMemo(
    () => new Set(saved.map((s) => s.numbers.join(','))),
    [saved]
  );

  const handleSave = useCallback((numbers, source) => {
    setSaved(addSet({ numbers, source }));
  }, []);

  const handleRemove = useCallback((id) => setSaved(removeSet(id)), []);
  const handleClear = useCallback(() => setSaved(clearSets()), []);

  const first = draws[0];
  const last = draws[draws.length - 1];

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__brand">
          <span className="masthead__dot" aria-hidden="true" />
          <h1>로또 번호 예측기</h1>
        </div>
        <p className="masthead__sub">
          {first?.round}–{last?.round}회 · 총 {draws.length}회분 당첨 데이터 분석
        </p>
      </header>

      <nav className="tabs" aria-label="화면 선택">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tabs__btn${tab === t.key ? ' tabs__btn--on' : ''}`}
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            {t.label}
            {t.key === 'saved' && saved.length > 0 && (
              <span className="tabs__count">{saved.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'predict' && (
          <PredictPanel
            model={model}
            draws={draws}
            avgSum={avgSum}
            savedKeys={savedKeys}
            onSave={handleSave}
          />
        )}
        {tab === 'machine' && (
          <MachinePanel
            model={model}
            draws={draws}
            savedKeys={savedKeys}
            onSave={handleSave}
          />
        )}
        {tab === 'stats' && <StatsPanel draws={draws} />}
        {tab === 'saved' && (
          <SavedPanel
            saved={saved}
            draws={draws}
            onRemove={handleRemove}
            onClear={handleClear}
          />
        )}
      </main>

      <footer className="footer">
        <details className="footer__details">
          <summary>모델이 보는 4가지 지표</summary>
          <ul>
            <li>
              <b>출현 빈도 ({Math.round(weights.base * 100)}%)</b> — 전체 기간
              동안 번호가 나온 횟수.
            </li>
            <li>
              <b>최근 흐름 ({Math.round(weights.recent * 100)}%)</b> — 최근 20회
              안에서의 출현.
            </li>
            <li>
              <b>미출현 기간 ({Math.round(weights.due * 100)}%)</b> — 마지막
              출현 이후 지난 회차 수.
            </li>
            <li>
              <b>동반 출현 ({Math.round(weights.synergy * 100)}%)</b> — 다른
              번호와 같이 나온 정도.
            </li>
          </ul>
        </details>

        <p className="footer__note">
          로또 추첨은 매 회차가 독립적인 확률 게임입니다. 과거 데이터로 다음 회차를
          맞힐 수는 없으며, 이 앱의 &lsquo;균형도&rsquo;는 당첨 확률이 아니라
          조합의 구조가 과거 당첨 조합과 얼마나 비슷한지를 나타내는 참고
          수치입니다. 재미로만 사용해 주세요.
        </p>
      </footer>
    </div>
  );
}
