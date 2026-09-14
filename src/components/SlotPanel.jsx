import React, { useCallback, useEffect, useRef, useState } from 'react';
import NumberBall from './NumberBall';
import { ALL_NUMBERS } from '../lib/draws';
import { ballColor } from '../lib/colors';
import { generateSet } from '../lib/predictor';
import { rankAgainst, RANK_LABEL } from '../lib/prize';
import { loadSlotStats, saveSlotStats } from '../lib/storage';

const REELS = 6;
const STRIP_LEN = 24;
const SPIN_SPEED = 2.1; // px/ms
const STOP_MS = 620;

/**
 * 칸 높이는 CSS 의 --slot-item 이 정한다 (좁은 화면에서 줄어든다).
 * 여기서 상수로 박아 두면 모바일에서 착지 위치가 어긋나므로 실행 중에 읽는다.
 */
function readItemHeight() {
  if (typeof window === 'undefined') return 54;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--slot-item');
  return parseFloat(raw) || 54;
}

/** 목표 번호를 임의 위치에 심은 릴 스트립을 만든다. */
function buildStrip(target) {
  const pool = ALL_NUMBERS.filter((n) => n !== target);
  const strip = Array.from(
    { length: STRIP_LEN - 1 },
    () => pool[Math.floor(Math.random() * pool.length)]
  );
  const targetIdx = Math.floor(Math.random() * STRIP_LEN);
  strip.splice(targetIdx, 0, target);
  return { strip, targetIdx };
}

/**
 * 가운데 칸에 targetIdx 가 오도록 최종 offset 을 구한다.
 *
 * 창은 3칸이고 스트립을 -X 만큼 올리므로 가운데 칸의 인덱스는
 * floor(X / itemH) + 1 이다. 따라서 X 는 (targetIdx - 1) 칸에 맞춰야 한다.
 */
function landingOffset(current, targetIdx, itemH) {
  const cycle = STRIP_LEN * itemH;
  const wantedFloor = (targetIdx - 1 + STRIP_LEN) % STRIP_LEN;
  const base = wantedFloor * itemH;
  // 멈출 때 최소 한 바퀴 이상은 더 돌아야 자연스럽다.
  const k = Math.ceil((current + cycle * 1.2 - base) / cycle);
  return k * cycle + base;
}

export default function SlotPanel({ model, draws }) {
  const latest = draws[draws.length - 1];
  const winning = new Set(latest.numbers);

  const [phase, setPhase] = useState('ready'); // ready | spinning | done
  const [locked, setLocked] = useState([]); // 확정된 번호들
  const [stats, setStats] = useState({ plays: 0, best: 0 });

  const stripRefs = useRef([]);
  const reelsRef = useRef([]);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const numbersRef = useRef([]);
  const itemHRef = useRef(54);

  useEffect(() => setStats(loadSlotStats()), []);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const applyTransform = (i) => {
    const el = stripRefs.current[i];
    const reel = reelsRef.current[i];
    if (el && reel) {
      const cycle = STRIP_LEN * itemHRef.current;
      el.style.transform = `translateY(${-(reel.offset % cycle)}px)`;
    }
  };

  const onReelStopped = useCallback((index) => {
    setLocked((prev) => [...prev, numbersRef.current[index]]);
  }, []);

  const loop = useCallback(
    (now) => {
      const dt = Math.min(now - lastRef.current, 50);
      lastRef.current = now;

      reelsRef.current.forEach((reel, i) => {
        if (reel.state === 'spin') {
          reel.offset += SPIN_SPEED * dt;
        } else if (reel.state === 'stopping') {
          const p = Math.min((now - reel.stopStart) / STOP_MS, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          reel.offset = reel.from + (reel.to - reel.from) * eased;
          if (p >= 1) {
            reel.offset = reel.to;
            reel.state = 'done';
            onReelStopped(i);
          }
        }
        applyTransform(i);
      });

      rafRef.current = requestAnimationFrame(loop);
    },
    [onReelStopped]
  );

  const start = () => {
    const numbers = generateSet({ model, strategy: 'balanced', targetSum: 138 });
    numbersRef.current = numbers;
    itemHRef.current = readItemHeight();
    const cycle = STRIP_LEN * itemHRef.current;

    reelsRef.current = numbers.map((n) => {
      const { strip, targetIdx } = buildStrip(n);
      return {
        strip,
        targetIdx,
        offset: Math.random() * cycle,
        state: 'spin',
        stopStart: 0,
        from: 0,
        to: 0,
      };
    });

    setLocked([]);
    setPhase('spinning');

    cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopNext = () => {
    const reel = reelsRef.current.find((r) => r.state === 'spin');
    if (!reel) return;
    reel.state = 'stopping';
    reel.stopStart = performance.now();
    reel.from = reel.offset;
    reel.to = landingOffset(reel.offset, reel.targetIdx, itemHRef.current);
    if (navigator.vibrate) navigator.vibrate(18);
  };

  const stopAll = () => {
    let delay = 0;
    for (const reel of reelsRef.current) {
      if (reel.state !== 'spin') continue;
      const r = reel;
      setTimeout(() => {
        if (r.state !== 'spin') return;
        r.state = 'stopping';
        r.stopStart = performance.now();
        r.from = r.offset;
        r.to = landingOffset(r.offset, r.targetIdx, itemHRef.current);
      }, delay);
      delay += 180;
    }
  };

  // 6개가 모두 확정되면 채점한다.
  useEffect(() => {
    if (phase !== 'spinning' || locked.length < REELS) return;

    cancelAnimationFrame(rafRef.current);
    setPhase('done');

    const result = rankAgainst(numbersRef.current, latest);
    setStats((prev) => {
      const next = {
        plays: prev.plays + 1,
        best: Math.max(prev.best, result.matchCount),
      };
      saveSlotStats(next);
      return next;
    });
    if (result.matchCount >= 3 && navigator.vibrate) {
      navigator.vibrate([40, 60, 120]);
    }
  }, [locked, phase, latest]);

  const hits = locked.filter((n) => winning.has(n)).length;
  const remaining = REELS - locked.length;
  const result = phase === 'done' ? rankAgainst(numbersRef.current, latest) : null;

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>슬롯머신</h2>
        <p>
          릴을 하나씩 직접 멈춰 보세요. 6칸이 다 채워지면 {latest.round}회
          당첨 번호와 바로 맞춰 드립니다.
        </p>
      </header>

      <div className="slot">
        <div className="slot__machine">
          {Array.from({ length: REELS }, (_, i) => {
            const reel = reelsRef.current[i];
            const isLocked = locked.length > i;
            const value = isLocked ? numbersRef.current[i] : null;
            const isHit = isLocked && winning.has(value);

            return (
              <div
                key={i}
                className={`slot__reel${isLocked ? ' is-locked' : ''}${
                  isHit ? ' is-hit' : ''
                }`}
              >
                <div className="slot__window">
                  {reel ? (
                    <div
                      className="slot__strip"
                      ref={(el) => (stripRefs.current[i] = el)}
                    >
                      {[...reel.strip, ...reel.strip].map((n, idx) => (
                        <span
                          key={idx}
                          className="slot__item"
                          style={{ color: ballColor(n) }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="slot__item slot__item--idle">?</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {phase === 'spinning' && (
          <div className="slot__live" aria-live="polite">
            <span className="slot__live-count">
              현재 <b>{hits}</b>개 적중
            </span>
            <span className="slot__live-left">
              {remaining > 0 ? `${remaining}칸 남음` : '채점 중…'}
            </span>
          </div>
        )}

        <div className="slot__controls">
          {phase === 'ready' && (
            <button type="button" className="btn btn--gold btn--lg" onClick={start}>
              🎰 돌리기
            </button>
          )}

          {phase === 'spinning' && (
            <>
              <button
                type="button"
                className="btn btn--gold btn--lg"
                onClick={stopNext}
                disabled={remaining === 0}
              >
                멈추기 ({locked.length + 1}/{REELS})
              </button>
              <button type="button" className="btn btn--ghost" onClick={stopAll}>
                전부 멈추기
              </button>
            </>
          )}

          {phase === 'done' && result && (
            <div
              className={`slot__result${
                result.rank > 0 ? ' is-win' : result.matchCount === 2 ? ' is-near' : ''
              }`}
            >
              <div className="slot__balls">
                {[...numbersRef.current].sort((a, b) => a - b).map((n) => (
                  <NumberBall
                    key={n}
                    number={n}
                    size="md"
                    highlight={result.matches.includes(n)}
                    // 하나도 못 맞혔으면 흐리게 할 기준이 없다. 전부 또렷하게 둔다.
                    dimmed={result.matchCount > 0 && !result.matches.includes(n)}
                  />
                ))}
              </div>
              <strong className="slot__headline">
                {result.rank > 0
                  ? `${RANK_LABEL[result.rank]} 당첨!`
                  : result.matchCount === 2
                    ? '2개 적중 · 아깝다!'
                    : `${result.matchCount}개 적중`}
              </strong>
              <button type="button" className="btn btn--gold btn--lg" onClick={start}>
                한 번 더
              </button>
            </div>
          )}
        </div>

        <div className="slot__stats">
          <span>
            돌린 횟수 <b>{stats.plays}</b>회
          </span>
          <span>
            최고 기록 <b>{stats.best}</b>개 적중
          </span>
        </div>
      </div>
    </section>
  );
}
