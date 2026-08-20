/**
 * 동행복권 공개 엔드포인트에서 최신 회차를 받아 src/data/lottoData.js 에 붙인다.
 *
 *   node scripts/update-draws.mjs
 *
 * 매주 토요일 추첨(20:35 KST) 후 실행하면 된다.
 * 데이터가 오래되면 통계와 당첨 확인이 모두 어긋나므로, 이 스크립트를
 * 크론이나 GitHub Actions 에 걸어 두는 것을 권한다.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = join(root, 'src/data/lottoData.js');
const ENDPOINT = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

async function fetchRound(round) {
  const res = await fetch(`${ENDPOINT}${round}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${round}회)`);
  const data = await res.json();
  // 아직 추첨하지 않은 회차는 returnValue 가 "fail" 이다.
  if (data.returnValue !== 'success') return null;
  return {
    round: data.drwNo,
    numbers: [
      data.drwtNo1, data.drwtNo2, data.drwtNo3,
      data.drwtNo4, data.drwtNo5, data.drwtNo6,
    ],
    bonus: data.bnusNo,
  };
}

const source = await readFile(dataFile, 'utf8');

// 첫 회차는 백틱과 같은 줄에 있어 ^ 로는 잡히지 않는다.
// 템플릿 리터럴 본문을 먼저 떼어 낸 뒤 줄 단위로 읽는다.
const body = source.match(/lottoDataStr\s*=\s*`([\s\S]*?)`/)?.[1] ?? '';
const rounds = [...body.matchAll(/^(\d+)\s/gm)].map((m) => Number(m[1]));

if (rounds.length === 0) {
  throw new Error('기존 회차를 읽지 못했습니다. lottoData.js 형식을 확인하세요.');
}

const latest = Math.max(...rounds);
console.log(`현재 최신 회차: ${latest}`);

const fresh = [];
for (let round = latest + 1; ; round++) {
  let draw;
  try {
    draw = await fetchRound(round);
  } catch (err) {
    console.error(`  ${round}회 조회 실패: ${err.message}`);
    break;
  }
  if (!draw) break;
  fresh.push(draw);
  console.log(`  + ${draw.round}회  ${draw.numbers.join(', ')} + ${draw.bonus}`);
  if (fresh.length >= 200) break; // 안전장치
}

if (fresh.length === 0) {
  console.log('추가할 새 회차가 없습니다.');
  process.exit(0);
}

// 파일은 최신 회차가 위에 오는 순서로 유지한다.
const lines = fresh
  .sort((a, b) => b.round - a.round)
  .map((d) => `${d.round} ${d.numbers.join(', ')} ${d.bonus}`)
  .join('\n');

const updated = source.replace(
  /export const lottoDataStr = `/,
  () => `export const lottoDataStr = \`${lines}\n`
);

if (updated === source) {
  throw new Error('lottoData.js 에 삽입하지 못했습니다. 파일 형식을 확인하세요.');
}

await writeFile(dataFile, updated, 'utf8');
console.log(`\n${fresh.length}개 회차를 추가했습니다. (최신 ${fresh[0].round}회)`);
