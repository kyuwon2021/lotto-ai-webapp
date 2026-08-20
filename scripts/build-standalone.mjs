/**
 * vite build 결과물을 파일 하나짜리 HTML로 합친다.
 *
 * 빌드 서버나 npm 없이도 브라우저에서 바로 열어볼 수 있도록
 * JS/CSS를 index.html 안에 인라인해 `standalone.html`을 만든다.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const readAsset = async (name) => readFile(join(dist, 'assets', name), 'utf8');

const assets = await readdir(join(dist, 'assets'));
const jsName = assets.find((f) => f.endsWith('.js'));
const cssName = assets.find((f) => f.endsWith('.css'));

if (!jsName) throw new Error('dist/assets 안에서 JS 번들을 찾지 못했습니다.');

const [js, css] = await Promise.all([
  readAsset(jsName),
  cssName ? readAsset(cssName) : Promise.resolve(''),
]);

let html = await readFile(join(dist, 'index.html'), 'utf8');

// 외부 참조 태그를 제거하고 내용을 직접 삽입한다.
html = html
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
  .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')
  .replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

// </script> 문자열이 스크립트 블록을 조기 종료시키지 않도록 이스케이프한다.
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

// 치환값은 반드시 함수로 넘긴다. 문자열로 넘기면 번들 안의 `$&`, "$'", '$`'
// 같은 시퀀스를 replace 가 치환 패턴으로 해석해 코드가 깨진다.
html = html
  .replace('</head>', () => `  <style>\n${css}\n  </style>\n  </head>`)
  .replace(
    '</body>',
    () => `  <script type="module">\n${safeJs}\n  </script>\n  </body>`
  );

// 번들이 한 글자도 변형되지 않고 들어갔는지 확인한다.
if (!html.includes(safeJs) || (css && !html.includes(css))) {
  throw new Error('인라인 과정에서 번들이 변형되었습니다. 치환 로직을 확인하세요.');
}

const out = join(root, 'standalone.html');
await writeFile(out, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log(`standalone.html 생성 완료 (${kb} KB) — 브라우저로 바로 열 수 있습니다.`);
