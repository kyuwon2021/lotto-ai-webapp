import React, { useCallback, useEffect, useRef, useState } from 'react';
import NumberBall from './NumberBall';
import { generateSet } from '../lib/predictor';
import { rankAgainst, RANK_LABEL } from '../lib/prize';
import { loadScratchStats, saveScratchStats } from '../lib/storage';

/** 이 비율만큼 긁으면 나머지는 자동으로 벗겨진다. */
const AUTO_REVEAL = 0.55;
const BRUSH = 22;

/** 낙첨일 때의 반응. 당첨이면 실제 등수를 쓴다. */
const MISS_REACTIONS = {
  0: { text: '다음 장에 기대를', emoji: '🙂', tone: 'none' },
  1: { text: '하나 걸렸다', emoji: '🙂', tone: 'none' },
  2: { text: '아깝다! 하나만 더', emoji: '😮', tone: 'near' },
};

/**
 * 등수별 연출.
 * 맞힌 개수만으로 등수를 정하면 안 된다 — 5개 + 보너스는 3등이 아니라 2등이다.
 */
const WIN_REACTIONS = {
  5: { emoji: '🎉', tone: 'win', bangs: '!' },
  4: { emoji: '🔥', tone: 'win', bangs: '!!' },
  3: { emoji: '🤯', tone: 'big', bangs: '!!!' },
  2: { emoji: '😱', tone: 'big', bangs: '!!!!' },
  1: { emoji: '👑', tone: 'big', bangs: '!!!!!' },
};

function reactionFor(result) {
  if (result.rank > 0) {
    const r = WIN_REACTIONS[result.rank];
    return { ...r, text: `${RANK_LABEL[result.rank]} 당첨${r.bangs}` };
  }
  return MISS_REACTIONS[result.matchCount] ?? MISS_REACTIONS[0];
}

export default function ScratchPanel({ model, draws }) {
  const latest = draws[draws.length - 1];

  const [numbers, setNumbers] = useState(() =>
    generateSet({
      model,
      strategy: 'balanced',
      targetSum: 138,
    })
  );
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ count: 0, best: 0 });

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);
  const checkedAt = useRef(0);

  useEffect(() => setStats(loadScratchStats()), []);

  const result = rankAgainst(numbers, latest);
  const reaction = reactionFor(result);

  /* ---- 은박 코팅 그리기 ---- */
  const paintCoating = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#8e99ab');
    grad.addColorStop(0.35, '#d7dde6');
    grad.addColorStop(0.5, '#aeb8c7');
    grad.addColorStop(0.7, '#e7ecf3');
    grad.addColorStop(1, '#7d8797');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 거친 은박 질감
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < width * height * 0.006; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
    }

    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('여기를 긁어 주세요', width / 2, height / 2);
  }, []);

  useEffect(() => {
    paintCoating();
    const onResize = () => {
      if (!revealed) paintCoating();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [paintCoating, revealed]);

  /* ---- 긁은 비율 측정 ---- */
  const scratchedRatio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    // 알파 채널만 듬성듬성 본다.
    for (let i = 3; i < data.length; i += 4 * 40) {
      total += 1;
      if (data[i] < 24) clear += 1;
    }
    return total ? clear / total : 0;
  };

  const finish = useCallback(() => {
    setRevealed(true);
    setStats((prev) => {
      const next = {
        count: prev.count + 1,
        best: Math.max(prev.best, result.matchCount),
      };
      saveScratchStats(next);
      return next;
    });
    if (result.matchCount >= 3 && navigator.vibrate) {
      navigator.vibrate([40, 60, 120]);
    }
  }, [result.matchCount]);

  /* ---- 스크래치 입력 ---- */
  const pointFrom = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const scratchTo = (pt) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lastPt.current) {
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    lastPt.current = pt;
  };

  const handleDown = (e) => {
    if (revealed) return;
    e.preventDefault();
    drawing.current = true;
    lastPt.current = null;
    scratchTo(pointFrom(e));
  };

  const handleMove = (e) => {
    if (!drawing.current || revealed) return;
    e.preventDefault();
    scratchTo(pointFrom(e));

    // 매 프레임 픽셀을 읽으면 무거우므로 간격을 둔다.
    const now = performance.now();
    if (now - checkedAt.current > 180) {
      checkedAt.current = now;
      if (scratchedRatio() >= AUTO_REVEAL) {
        drawing.current = false;
        finish();
      }
    }
  };

  const handleUp = () => {
    if (!drawing.current || revealed) return;
    drawing.current = false;
    lastPt.current = null;
    if (scratchedRatio() >= AUTO_REVEAL) finish();
  };

  const nextCard = () => {
    setNumbers(
      generateSet({
        model,
        strategy: 'balanced',
        targetSum: 138,
      })
    );
    setRevealed(false);
    lastPt.current = null;
    checkedAt.current = 0;
    requestAnimationFrame(paintCoating);
  };

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>즉석 복권</h2>
        <p>
          긁으면 번호가 나옵니다. 바로 {latest.round}회 당첨 번호와 맞춰
          알려 드립니다.
        </p>
      </header>

      <div className={`scratch${revealed ? ' is-revealed' : ''}`}>
        <div className="scratch__card" ref={wrapRef}>
          <div className="scratch__balls">
            {numbers.map((n) => (
              <NumberBall
                key={n}
                number={n}
                size="md"
                highlight={revealed && result.matches.includes(n)}
              />
            ))}
          </div>
          {!revealed && (
            <canvas
              ref={canvasRef}
              className="scratch__coat"
              onMouseDown={handleDown}
              onMouseMove={handleMove}
              onMouseUp={handleUp}
              onMouseLeave={handleUp}
              onTouchStart={handleDown}
              onTouchMove={handleMove}
              onTouchEnd={handleUp}
            />
          )}
        </div>

        {revealed ? (
          <div className={`scratch__result scratch__result--${reaction.tone}`}>
            <span className="scratch__emoji">{reaction.emoji}</span>
            <strong className="scratch__headline">
              {result.matchCount}개 적중 · {reaction.text}
            </strong>
            <span className="scratch__rank">
              {latest.round}회 당첨 번호 기준
              {result.hasBonus && ' · 보너스 포함'}
            </span>
            <button type="button" className="btn btn--gold btn--lg" onClick={nextCard}>
              한 장 더
            </button>
          </div>
        ) : (
          <p className="scratch__guide">손가락이나 마우스로 문질러 보세요</p>
        )}

        <div className="scratch__stats">
          <span>
            긁은 복권 <b>{stats.count}</b>장
          </span>
          <span>
            최고 기록 <b>{stats.best}</b>개 적중
          </span>
        </div>
      </div>
    </section>
  );
}
