import React from 'react';
import { ballColor } from '../lib/colors';

/**
 * 크기는 클래스로만 정한다. 인라인 스타일로 주면 미디어 쿼리가
 * 이를 덮어쓸 수 없어서 좁은 화면에서 줄바꿈이 생긴다.
 */
export default function NumberBall({
  number,
  size = 'md',
  dimmed = false,
  highlight = false,
  onClick,
  title,
}) {
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      className={[
        'ball',
        `ball--${size}`,
        highlight ? 'ball--highlight' : '',
        dimmed ? 'ball--dimmed' : '',
        onClick ? 'ball--interactive' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--ball-color': ballColor(number) }}
    >
      {number}
    </Tag>
  );
}
