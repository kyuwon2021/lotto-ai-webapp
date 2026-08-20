import React, { useEffect, useRef } from 'react';
import { ballColor } from '../lib/colors';

/* 캔버스 논리 좌표계 (실제 픽셀은 devicePixelRatio 로 스케일) */
const W = 420;
const H = 400;
const CX = W / 2;
const CY = 196;
const R = 150;
const BALL_R = 13;
const OUTLET = { x: CX, y: 18 };

const GRAVITY = 0.34;
const DAMPING = 0.985;
const WALL_BOUNCE = 0.6;
const MAX_SPEED = 9;
/** 송풍구 바람이 닿는 높이 — 챔버 아래쪽 55%까지만 밀어 올린다. */
const BLOWER_REACH = 0.55;

const MIX_MS = 1000;
const EJECT_MS = 700;

function makeBalls() {
  return Array.from({ length: 45 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (R - BALL_R - 6);
    return {
      n: i + 1,
      x: CX + Math.cos(angle) * dist,
      y: CY + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
    };
  });
}

function weightedPick(balls, weights) {
  const total = balls.reduce((acc, b) => acc + Math.max(weights?.[b.n] ?? 1, 0.01), 0);
  let r = Math.random() * total;
  for (const b of balls) {
    r -= Math.max(weights?.[b.n] ?? 1, 0.01);
    if (r <= 0) return b;
  }
  return balls[balls.length - 1];
}

function stepPhysics(balls, turbulence) {
  for (const b of balls) {
    b.vy += GRAVITY;

    if (turbulence > 0) {
      // 바닥 송풍구에서 올라오는 바람. 위로 갈수록 약해지므로
      // 공이 천장에 붙지 않고 아래에서 위로 순환한다.
      const height = (CY + R - b.y) / (2 * R); // 0 = 바닥, 1 = 천장
      const lift = Math.max(0, 1 - height / BLOWER_REACH);
      b.vy -= turbulence * lift * 0.6;

      // 난류
      b.vx += (Math.random() - 0.5) * turbulence * 2.2;
      b.vy += (Math.random() - 0.5) * turbulence * 1.1;

      // 약한 소용돌이
      b.vx -= (b.y - CY) * 0.0022 * turbulence;
      b.vy += (b.x - CX) * 0.0022 * turbulence;
    }

    b.vx *= DAMPING;
    b.vy *= DAMPING;

    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_SPEED) {
      b.vx = (b.vx / speed) * MAX_SPEED;
      b.vy = (b.vy / speed) * MAX_SPEED;
    }

    b.x += b.vx;
    b.y += b.vy;
  }

  // 공끼리 충돌 — 겹침을 밀어내고 법선 방향 속도를 교환한다.
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const min = BALL_R * 2;
      if (distSq >= min * min || distSq === 0) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (min - dist) / 2;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rel > 0) continue;
      const impulse = rel * 0.85;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
    }
  }

  // 원형 벽 충돌
  for (const b of balls) {
    const dx = b.x - CX;
    const dy = b.y - CY;
    const dist = Math.hypot(dx, dy);
    const limit = R - BALL_R - 2;
    if (dist <= limit) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    b.x = CX + nx * limit;
    b.y = CY + ny * limit;
    const dot = b.vx * nx + b.vy * ny;
    b.vx = (b.vx - 2 * dot * nx) * WALL_BOUNCE;
    b.vy = (b.vy - 2 * dot * ny) * WALL_BOUNCE;
  }
}

function drawBall(ctx, x, y, n, radius = BALL_R) {
  const color = ballColor(n);
  const grad = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.4,
    radius * 0.1,
    x,
    y,
    radius
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.round(radius * 0.95)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y + 0.5);
}

function drawChassis(ctx, remaining) {
  // 배경
  ctx.clearRect(0, 0, W, H);

  // 배출관
  ctx.fillStyle = 'rgba(148,163,184,0.22)';
  ctx.fillRect(CX - 22, 8, 44, 58);
  ctx.strokeStyle = 'rgba(226,232,240,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(CX - 22, 8, 44, 58);

  // 받침대
  const baseGrad = ctx.createLinearGradient(0, CY + R - 18, 0, H);
  baseGrad.addColorStop(0, '#1e293b');
  baseGrad.addColorStop(1, '#0b1220');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(CX - 120, CY + R - 10);
  ctx.lineTo(CX + 120, CY + R - 10);
  ctx.lineTo(CX + 150, H - 6);
  ctx.lineTo(CX - 150, H - 6);
  ctx.closePath();
  ctx.fill();

  // 유리 챔버 내부
  const inner = ctx.createRadialGradient(
    CX - R * 0.3,
    CY - R * 0.35,
    R * 0.1,
    CX,
    CY,
    R
  );
  inner.addColorStop(0, 'rgba(56,189,248,0.16)');
  inner.addColorStop(0.6, 'rgba(15,23,42,0.85)');
  inner.addColorStop(1, 'rgba(2,6,23,0.95)');
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.fillStyle = inner;
  ctx.fill();

  // 남은 공 개수
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`남은 공 ${remaining}`, CX, H - 22);
}

function drawGlass(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.clip();
  const sheen = ctx.createLinearGradient(CX - R, CY - R, CX + R * 0.4, CY + R);
  sheen.addColorStop(0, 'rgba(255,255,255,0.16)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(226,232,240,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, R - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * 로또 추첨기.
 * `active` 가 true 이고 아직 6개를 다 뽑지 않았으면 한 개씩 추첨해 onDrawn 을 호출한다.
 */
export default function LottoMachine({
  active = false,
  drawnCount = 0,
  weights,
  onDrawn,
  resetToken = 0,
}) {
  const canvasRef = useRef(null);
  const propsRef = useRef({ active, drawnCount, weights, onDrawn });
  propsRef.current = { active, drawnCount, weights, onDrawn };

  const worldRef = useRef({
    balls: makeBalls(),
    phase: 'idle',
    phaseStart: 0,
    target: null,
    from: null,
  });

  // 새 게임이면 공을 다시 채운다.
  useEffect(() => {
    worldRef.current = {
      balls: makeBalls(),
      phase: 'idle',
      phaseStart: 0,
      target: null,
      from: null,
    };
  }, [resetToken]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let cancelled = false;

    const frame = (now) => {
      if (cancelled) return;
      const world = worldRef.current;
      const { active: isActive, drawnCount: drawn, weights: w, onDrawn: cb } =
        propsRef.current;

      // ---- 상태 전이 ----
      if (world.phase === 'idle' && isActive && drawn < 6 && world.balls.length) {
        world.phase = 'mixing';
        world.phaseStart = now;
      }

      if (world.phase === 'mixing' && now - world.phaseStart >= MIX_MS) {
        const chosen = weightedPick(world.balls, w);
        world.balls = world.balls.filter((b) => b !== chosen);
        world.target = chosen;
        world.from = { x: chosen.x, y: chosen.y };
        world.phase = 'ejecting';
        world.phaseStart = now;
      }

      let ejectProgress = 0;
      if (world.phase === 'ejecting') {
        ejectProgress = Math.min((now - world.phaseStart) / EJECT_MS, 1);
        if (ejectProgress >= 1) {
          const drawnNumber = world.target.n;
          world.phase = 'idle';
          world.target = null;
          world.from = null;
          cb?.(drawnNumber);
        }
      }

      // ---- 물리 ----
      const turbulence =
        world.phase === 'mixing' ? 1.6 : world.phase === 'ejecting' ? 0.75 : 0.05;
      stepPhysics(world.balls, turbulence);

      // ---- 렌더 ----
      drawChassis(ctx, world.balls.length);
      for (const b of world.balls) drawBall(ctx, b.x, b.y, b.n);
      drawGlass(ctx);

      if (world.phase === 'ejecting' && world.target) {
        const t = ejectProgress;
        const ease = 1 - Math.pow(1 - t, 2.2);
        // 살짝 휘어지는 경로로 배출관까지 이동
        const midX = (world.from.x + OUTLET.x) / 2 + (CX - world.from.x) * 0.25;
        const midY = Math.min(world.from.y, OUTLET.y) - 30;
        const inv = 1 - ease;
        const x =
          inv * inv * world.from.x + 2 * inv * ease * midX + ease * ease * OUTLET.x;
        const y =
          inv * inv * world.from.y + 2 * inv * ease * midY + ease * ease * OUTLET.y;

        ctx.save();
        ctx.shadowColor = 'rgba(56,189,248,0.9)';
        ctx.shadowBlur = 22;
        drawBall(ctx, x, y, world.target.n, BALL_R + 3 * (1 - ease));
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="machine-canvas"
      style={{ aspectRatio: `${W} / ${H}` }}
      role="img"
      aria-label="로또 번호 추첨기"
    />
  );
}
