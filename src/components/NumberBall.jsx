import React from 'react';

export default function NumberBall({ number, size = 'normal' }) {
  const getColor = (num) => {
    if (num <= 10) return '#facc15';
    if (num <= 20) return '#3b82f6';
    if (num <= 30) return '#ef4444';
    if (num <= 40) return '#6b7280';
    return '#22c55e';
  };

  const sizePx = size === 'large' ? 64 : size === 'small' ? 36 : 48;

  return (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: '999px',
        background: `radial-gradient(circle at 30% 30%, #ffffff, ${getColor(number)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#111827',
        fontWeight: 800,
        fontSize: size === 'large' ? 24 : size === 'small' ? 14 : 18,
        boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
      }}
    >
      {number}
    </div>
  );
}
