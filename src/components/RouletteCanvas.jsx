import React, { useEffect, useRef } from 'react';

function weightedPick(weights, exclude = []) {
  const entries = Object.entries(weights).filter(
    ([num]) => !exclude.includes(parseInt(num, 10))
  );
  let total = 0;
  entries.forEach(([_, w]) => (total += w));
  let r = Math.random() * total;
  for (const [num, w] of entries) {
    r -= w;
    if (r <= 0) return parseInt(num, 10);
  }
  return parseInt(entries[entries.length - 1][0], 10);
}

export default function RouletteCanvas({ aiScores, onSpinEnd, spinIndex, excludeNumbers = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (spinIndex == null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 420;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.45;
    const numbers = Array.from({ length: 45 }, (_, i) => i + 1);
    const baseOrder = numbers;
    const anglePer = (Math.PI * 2) / baseOrder.length;

    // build weights (AI 가중치, 이미 뽑힌 번호 제외)
    const weights = {};
    const sortedAI = Object.entries(aiScores).sort((a, b) => b[1] - a[1]);
    const top6 = new Set(sortedAI.slice(0, 6).map(([n]) => parseInt(n, 10)));
    const nextHot = new Set(sortedAI.slice(6, 16).map(([n]) => parseInt(n, 10)));

    for (let n = 1; n <= 45; n++) {
      let w = 1;
      if (top6.has(n)) w = 1.8;
      else if (nextHot.has(n)) w = 1.3;
      weights[n] = w;
    }

    const targetNumber = weightedPick(weights, excludeNumbers);
    const targetIndex = baseOrder.indexOf(targetNumber);

    const pointerAngle = -Math.PI / 2;
    const extraTurns = 4 + Math.random() * 2;
    const finalAngle =
      extraTurns * Math.PI * 2 +
      (pointerAngle - (targetIndex + 0.5) * anglePer);

    let start = null;
    const duration = 4000 + Math.random() * 1000;

    const spinSound = document.getElementById('spin-sound');
    const clickSound = document.getElementById('click-sound');

    if (spinSound) {
      try { spinSound.currentTime = 0; spinSound.play(); } catch {}
    }

    function drawFrame(timestamp) {
      if (!start) start = timestamp;
      const t = timestamp - start;
      const progress = Math.min(t / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = eased * finalAngle;

      ctx.clearRect(0, 0, size, size);

      const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.4);
      bgGrad.addColorStop(0, '#111827');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const ringGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
      ringGrad.addColorStop(0, '#1f2933');
      ringGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = ringGrad;
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < baseOrder.length; i++) {
        const num = baseOrder[i];
        const startAngle = angle + i * anglePer;
        const endAngle = startAngle + anglePer;
        const isExcluded = excludeNumbers.includes(num);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * 0.96, startAngle, endAngle);
        const even = i % 2 === 0;
        const slotGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
        if (isExcluded) {
          slotGrad.addColorStop(0, '#1a1a2e');
          slotGrad.addColorStop(1, '#0d0d1a');
        } else if (even) {
          slotGrad.addColorStop(0, '#4b5563');
          slotGrad.addColorStop(1, '#111827');
        } else {
          slotGrad.addColorStop(0, '#9ca3af');
          slotGrad.addColorStop(1, '#4b5563');
        }
        ctx.fillStyle = slotGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(15,23,42,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * 0.96, startAngle, endAngle);
        ctx.stroke();

        const midAngle = startAngle + anglePer / 2;
        const tx = cx + Math.cos(midAngle) * radius * 0.78;
        const ty = cy + Math.sin(midAngle) * radius * 0.78;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = isExcluded ? 'rgba(249,250,251,0.25)' : '#f9fafb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
      }

      // 중앙 원
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
      const centerGrad = ctx.createRadialGradient(
        cx - radius * 0.1, cy - radius * 0.1, radius * 0.05,
        cx, cy, radius * 0.35
      );
      centerGrad.addColorStop(0, '#e5e7eb');
      centerGrad.addColorStop(1, '#374151');
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // 중앙 추첨 회차 표시
      ctx.font = `bold ${spinIndex != null ? 18 : 14}px system-ui`;
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${spinIndex + 1}/6`, cx, cy);

      // 포인터
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius * 1.05);
      ctx.lineTo(cx - 14, cy - radius * 0.9);
      ctx.lineTo(cx + 14, cy - radius * 0.9);
      ctx.closePath();
      const pointerGrad = ctx.createLinearGradient(cx, cy - radius * 1.05, cx, cy - radius * 0.9);
      pointerGrad.addColorStop(0, '#f97316');
      pointerGrad.addColorStop(1, '#facc15');
      ctx.fillStyle = pointerGrad;
      ctx.fill();

      // 구슬
      const ballAngle = pointerAngle;
      const bx = cx + Math.cos(ballAngle) * radius * 0.7;
      const by = cy + Math.sin(ballAngle) * radius * 0.7;
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, 10);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(1, '#d1d5db');
      ctx.fillStyle = ballGrad;
      ctx.fill();

      if (progress < 1) {
        requestAnimationFrame(drawFrame);
      } else {
        if (spinSound) { try { spinSound.pause(); } catch {} }
        if (clickSound) { try { clickSound.currentTime = 0; clickSound.play(); } catch {} }
        onSpinEnd && onSpinEnd(targetNumber);
      }
    }

    requestAnimationFrame(drawFrame);
  }, [spinIndex]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}
    />
  );
}
