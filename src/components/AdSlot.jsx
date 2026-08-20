import React, { useEffect, useRef } from 'react';

/**
 * 광고 슬롯.
 *
 * `VITE_ADSENSE_CLIENT` 가 설정되어 있으면 실제 애드센스 광고를 띄우고,
 * 없으면 자리만 잡아 두어 레이아웃이 흔들리지 않게 한다.
 * (광고가 나중에 삽입되며 콘텐츠가 밀리는 CLS 를 막기 위해 높이를 미리 확보한다.)
 */
export default function AdSlot({ slot, format = 'auto', minHeight = 100, label = true }) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  const ref = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* 광고 차단기 등으로 실패해도 페이지는 정상 동작해야 한다. */
    }
  }, [client, slot]);

  return (
    <div className="ad" style={{ minHeight }}>
      {label && <span className="ad__label">광고</span>}
      {client && slot ? (
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <span className="ad__placeholder">광고 영역</span>
      )}
    </div>
  );
}
