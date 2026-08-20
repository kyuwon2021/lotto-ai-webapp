import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

/**
 * 애드센스 로더는 클라이언트 ID 가 설정된 경우에만 붙인다.
 * (.env 에 VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXX 형태로 넣는다.)
 */
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT;
if (adsenseClient) {
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
