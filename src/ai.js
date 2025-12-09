import _ from 'lodash';
import { lottoDataStr } from './data/lottoData';

export const parseLottoData = () => {
  const lines = lottoDataStr.trim().split('\n');
  return lines.map(line => {
    const parts = line.split(' ');
    const round = parseInt(parts[0]);
    const nums = parts.slice(1, 7).map(n => parseInt(n.replace(',', '')));
    const bonus = parseInt(parts[7]);
    return { round, numbers: nums, bonus };
  }).reverse();
};

export const buildAIScores = (draws) => {
  const total = draws.length;
  const recent50 = draws.slice(-Math.min(50, total));

  const score = {};
  const freq = {};
  const shortFreq = {};
  const lastIndex = {};
  const corr = {};

  for (let n = 1; n <= 45; n++) {
    score[n] = 0;
    freq[n] = 0;
    shortFreq[n] = 0;
    lastIndex[n] = -1;
    corr[n] = 0;
  }

  // long-term freq
  draws.forEach((d, idx) => {
    d.numbers.forEach(n => {
      freq[n] += 1;
      lastIndex[n] = idx;
    });
  });

  for (let n = 1; n <= 45; n++) {
    score[n] += (freq[n] / total) * 1.5;
  }

  // recent freq
  recent50.forEach(d => {
    d.numbers.forEach(n => {
      shortFreq[n] += 1;
    });
  });
  const recentLen = recent50.length || 1;
  for (let n = 1; n <= 45; n++) {
    score[n] += (shortFreq[n] / recentLen) * 3.0;
  }

  // interval
  for (let n = 1; n <= 45; n++) {
    const interval = total - lastIndex[n];
    score[n] += Math.exp(-interval / 40) * 2.0;
  }

  // simple correlation
  draws.forEach(d => {
    d.numbers.forEach(a => {
      d.numbers.forEach(b => {
        if (a !== b) corr[a] += 1;
      });
    });
  });
  for (let n = 1; n <= 45; n++) {
    score[n] += (corr[n] / 6000) * 1.2;
  }

  // boosting
  for (let n = 1; n <= 45; n++) {
    score[n] = score[n] * 0.7 + Math.sqrt(Math.max(score[n], 0)) * 0.3;
  }

  return score;
};

export const generateAISet = (scores) => {
  const entries = Object.entries(scores);
  const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 12);
  const numbers = sorted.map(([n]) => parseInt(n, 10));
  const selected = _.sampleSize(numbers, 6);
  return selected.sort((a, b) => a - b);
};
