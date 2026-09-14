import React, { useRef, useState } from 'react';
import NumberBall from './NumberBall';
import NumberPicker from './NumberPicker';
import { ALL_NUMBERS } from '../lib/draws';
import { rankAgainst, RANK_LABEL } from '../lib/prize';
import { generateSet } from '../lib/predictor';
import { spreadWeights, popularityIndex } from '../lib/payout';

const TOTAL_ROUNDS = 5;

const RIVALS = {
  rookie: {
    key: 'rookie',
    name: '초보 루키',
    emoji: '🐣',
    taunt: '아무거나 찍어도 되는 거 아냐?',
    strategy: 'random',
  },
  analyst: {
    key: 'analyst',
    name: '통계 분석가',
    emoji: '🤓',
    taunt: '601회 데이터는 이미 다 외웠지.',
    strategy: 'hot',
  },
  master: {
    key: 'master',
    name: '분산 마스터',
    emoji: '🎩',
    taunt: '확률은 같아도 기댓값은 다르다네.',
    strategy: 'spread',
  },
};

export default function BattlePanel({ model, draws }) {
  const [rivalKey, setRivalKey] = useState('analyst');
  const [mine, setMine] = useState([]);
  const [stage, setStage] = useState('setup'); // setup | playing | over
  const [rivalNums, setRivalNums] = useState([]);
  const [history, setHistory] = useState([]);
  const [revealing, setRevealing] = useState(false);
  const usedRounds = useRef(new Set());

  const rival = RIVALS[rivalKey];
  const sorted = [...mine].sort((a, b) => a - b);
  const myScore = history.filter((h) => h.verdict === 'win').length;
  const rivalScore = history.filter((h) => h.verdict === 'lose').length;

  const makeRivalNumbers = () =>
    generateSet({
      model,
      strategy: rival.strategy,
      spread: spreadWeights(),
      scoreCombo: (c) => popularityIndex(c, draws),
    });

  const start = () => {
    if (mine.length !== 6) return;
    usedRounds.current = new Set();
    setRivalNums(makeRivalNumbers());
    setHistory([]);
    setStage('playing');
  };

  const playRound = () => {
    if (revealing || history.length >= TOTAL_ROUNDS) return;
    setRevealing(true);

    // 아직 안 쓴 회차 중 무작위로 하나
    let draw;
    do {
      draw = draws[Math.floor(Math.random() * draws.length)];
    } while (usedRounds.current.has(draw.round) && usedRounds.current.size < draws.length);
    usedRounds.current.add(draw.round);

    const me = rankAgainst(sorted, draw);
    const them = rankAgainst(rivalNums, draw);
    const verdict =
      me.matchCount > them.matchCount
        ? 'win'
        : me.matchCount < them.matchCount
          ? 'lose'
          : 'draw';

    setTimeout(() => {
      setHistory((prev) => {
        // 이 판을 치른 번호를 그대로 보관한다.
        // 아래에서 새 번호를 뽑기 때문에 rivalNums 를 참조하면 다음 판 번호가 보인다.
        const next = [...prev, { draw, me, them, verdict, rivalNums }];
        if (next.length >= TOTAL_ROUNDS) setStage('over');
        return next;
      });
      // 라이벌은 매 라운드 새 번호를 뽑는다.
      setRivalNums(makeRivalNumbers());
      setRevealing(false);
    }, 700);
  };

  const reset = () => {
    setStage('setup');
    setHistory([]);
  };

  const last = history[history.length - 1];

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>번호 배틀</h2>
        <p>
          과거 {draws.length}회 중 무작위 회차를 뽑아, 더 많이 맞힌 쪽이
          이깁니다. {TOTAL_ROUNDS}판 승부.
        </p>
      </header>

      {stage === 'setup' && (
        <>
          <div className="field">
            <span className="field__label">상대 고르기</span>
            <div className="rivals">
              {Object.values(RIVALS).map((r) => (
                <button
                  key={r.key}
                  type="button"
                  className={`rival${rivalKey === r.key ? ' rival--on' : ''}`}
                  onClick={() => setRivalKey(r.key)}
                >
                  <span className="rival__emoji">{r.emoji}</span>
                  <span className="rival__name">{r.name}</span>
                </button>
              ))}
            </div>
            <p className="field__hint">&ldquo;{rival.taunt}&rdquo;</p>
          </div>

          <NumberPicker picked={mine} onChange={setMine} label="내 번호" />

          <button
            type="button"
            className="btn btn--gold btn--lg"
            onClick={start}
            disabled={mine.length !== 6}
          >
            {mine.length === 6 ? '대결 시작' : `번호 ${6 - mine.length}개 더`}
          </button>
        </>
      )}

      {stage !== 'setup' && (
        <div className="battle">
          <div className="battle__score">
            <div className="battle__side">
              <span className="battle__who">나</span>
              <span className="battle__pts">{myScore}</span>
            </div>
            <span className="battle__vs">
              {history.length} / {TOTAL_ROUNDS}
            </span>
            <div className="battle__side">
              <span className="battle__who">
                {rival.emoji} {rival.name}
              </span>
              <span className="battle__pts">{rivalScore}</span>
            </div>
          </div>

          {last && (
            <div className={`battle__round battle__round--${last.verdict}`}>
              <span className="battle__round-title">
                {last.draw.round}회 ·{' '}
                {last.verdict === 'win' ? '내가 이겼다!' : last.verdict === 'lose' ? '졌다…' : '무승부'}
              </span>
              <div className="battle__answer">
                {last.draw.numbers.map((n) => (
                  <NumberBall key={n} number={n} size="sm" />
                ))}
              </div>
              <div className="battle__compare">
                <div>
                  <span className="battle__label">나 {last.me.matchCount}개</span>
                  <div className="battle__balls">
                    {sorted.map((n) => (
                      <NumberBall
                        key={n}
                        number={n}
                        size="xs"
                        highlight={last.me.matches.includes(n)}
                        dimmed={!last.me.matches.includes(n)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="battle__label">
                    {rival.name} {last.them.matchCount}개
                  </span>
                  <div className="battle__balls">
                    {last.rivalNums.map((n) => (
                      <NumberBall
                        key={n}
                        number={n}
                        size="xs"
                        highlight={last.them.matches.includes(n)}
                        dimmed={!last.them.matches.includes(n)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {last.me.rank > 0 && (
                <span className="battle__prize">
                  내 번호는 이 회차에서 {RANK_LABEL[last.me.rank]}
                </span>
              )}
            </div>
          )}

          {stage === 'playing' && (
            <button
              type="button"
              className="btn btn--gold btn--lg"
              onClick={playRound}
              disabled={revealing}
            >
              {revealing ? '회차 뽑는 중…' : history.length === 0 ? '첫 판 시작' : '다음 판'}
            </button>
          )}

          {stage === 'over' && (
            <div className="battle__final">
              <strong>
                {myScore > rivalScore
                  ? '🏆 승리!'
                  : myScore < rivalScore
                    ? '😵 패배'
                    : '🤝 무승부'}
              </strong>
              <span>
                {myScore} : {rivalScore}
              </span>
              <button type="button" className="btn btn--gold btn--sm" onClick={reset}>
                다시 대결
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
