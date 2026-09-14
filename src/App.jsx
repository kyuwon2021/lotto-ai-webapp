import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hero from './components/Hero';
import AdSlot from './components/AdSlot';
import PredictPanel from './components/PredictPanel';
import CheckPanel from './components/CheckPanel';
import MachinePanel from './components/MachinePanel';
import StatsPanel from './components/StatsPanel';
import SavedPanel from './components/SavedPanel';
import BattlePanel from './components/BattlePanel';
import TimeMachinePanel from './components/TimeMachinePanel';
import ScratchPanel from './components/ScratchPanel';
import { parseDraws } from './lib/draws';
import { buildModel } from './lib/predictor';
import { averageSum } from './lib/stats';
import { loadSets, addSet, removeSet, clearSets } from './lib/storage';

const TABS = [
  { key: 'scratch', label: '🎟️ 즉석복권' },
  { key: 'predict', label: '번호 받기' },
  { key: 'battle', label: '⚔️ 배틀' },
  { key: 'timemachine', label: '⏰ 타임머신' },
  { key: 'machine', label: '추첨기' },
  { key: 'check', label: '당첨 확인' },
  { key: 'stats', label: '통계' },
  { key: 'saved', label: '보관함' },
];

const draws = parseDraws();

export default function App() {
  const [tab, setTab] = useState('scratch');
  const [saved, setSaved] = useState([]);
  const contentRef = useRef(null);

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

  // 한 번이라도 게임에 들어가면 히어로를 접는다.
  // 펼친 상태로 두면 화면을 다 차지해 정작 게임이 스크롤 아래로 밀린다.
  const [heroOpen, setHeroOpen] = useState(true);

  const goTo = useCallback((key) => {
    setTab(key);
    setHeroOpen(false);
  }, []);

  const first = draws[0];
  const last = draws[draws.length - 1];

  return (
    <div className="app">
      <Hero
        drawCount={draws.length}
        open={heroOpen}
        onExpand={() => setHeroOpen(true)}
        onPrimary={() => goTo('scratch')}
        onSecondary={() => goTo('predict')}
      />

      <nav className="tabs" aria-label="화면 선택">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tabs__btn${tab === t.key ? ' tabs__btn--on' : ''}`}
            onClick={() => {
              setTab(t.key);
              setHeroOpen(false);
            }}
            aria-current={tab === t.key ? 'page' : undefined}
          >
            {t.label}
            {t.key === 'saved' && saved.length > 0 && (
              <span className="tabs__count">{saved.length}</span>
            )}
          </button>
        ))}
      </nav>

      <main className="content" ref={contentRef}>
        {tab === 'predict' && (
          <PredictPanel
            model={model}
            draws={draws}
            avgSum={avgSum}
            savedKeys={savedKeys}
            onSave={handleSave}
          />
        )}
        {tab === 'scratch' && <ScratchPanel model={model} draws={draws} />}
        {tab === 'battle' && <BattlePanel model={model} draws={draws} />}
        {tab === 'timemachine' && <TimeMachinePanel draws={draws} saved={saved} />}
        {tab === 'check' && <CheckPanel draws={draws} saved={saved} />}
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

      <AdSlot slot={import.meta.env.VITE_AD_SLOT_FOOTER} minHeight={100} />

      <footer className="footer">
        <details className="footer__details">
          <summary>번호는 어떻게 만들어지나요?</summary>
          <p className="footer__lead">
            {first?.round}–{last?.round}회 당첨 번호에서 아래 4가지를 집계한 뒤,
            0~1로 정규화해 가중 합산합니다.
          </p>
          <ul>
            <li>
              <b>출현 빈도 ({Math.round(weights.base * 100)}%)</b> — 전체 기간
              동안 번호가 나온 횟수
            </li>
            <li>
              <b>최근 흐름 ({Math.round(weights.recent * 100)}%)</b> — 최근 20회
              안에서의 출현
            </li>
            <li>
              <b>미출현 기간 ({Math.round(weights.due * 100)}%)</b> — 마지막
              출현 이후 지난 회차 수
            </li>
            <li>
              <b>동반 출현 ({Math.round(weights.synergy * 100)}%)</b> — 다른
              번호와 같이 나온 정도
            </li>
          </ul>
        </details>

        <p className="footer__note">
          로또 추첨은 매 회차가 독립적인 확률 게임입니다. 과거 데이터로 다음 회차를
          맞힐 수는 없으며, 이 사이트가 만드는 번호의 당첨 확률은 직접 고른 번호나
          자동 번호와 <b>완전히 같습니다</b>. &lsquo;균형도&rsquo;는 당첨 확률이
          아니라 조합의 구조가 과거 당첨 조합과 얼마나 비슷한지를 나타내는 참고
          수치입니다.
        </p>

        <p className="footer__note">
          19세 미만은 복권을 구매할 수 없습니다. 과도한 구매는 사행성 문제로
          이어질 수 있습니다. 도박 문제 상담 —{' '}
          <a href="tel:1336">한국도박문제예방치유원 1336</a>
        </p>
      </footer>
    </div>
  );
}
