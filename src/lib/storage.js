const KEY = 'lotto-ai:saved-sets:v1';

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

export function loadSets() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => Array.isArray(item?.numbers) && item.numbers.length === 6
    );
  } catch {
    return [];
  }
}

function persist(sets) {
  if (!canUseStorage()) return sets;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sets));
  } catch {
    /* 저장 공간이 없거나 차단된 경우 조용히 무시한다. */
  }
  return sets;
}

export function addSet(entry) {
  const sets = loadSets();
  const key = entry.numbers.join(',');
  if (sets.some((s) => s.numbers.join(',') === key)) return sets;
  return persist([
    { id: `${Date.now()}-${key}`, savedAt: Date.now(), ...entry },
    ...sets,
  ]);
}

export function removeSet(id) {
  return persist(loadSets().filter((s) => s.id !== id));
}

export function clearSets() {
  return persist([]);
}

/* ── 즉석 복권 기록 ─────────────────────────────────────────── */

const SCRATCH_KEY = 'lotto-ai:scratch:v1';
const EMPTY_SCRATCH = { count: 0, best: 0 };

export function loadScratchStats() {
  if (!canUseStorage()) return { ...EMPTY_SCRATCH };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SCRATCH_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_SCRATCH };
    return {
      count: Number(parsed.count) || 0,
      best: Number(parsed.best) || 0,
    };
  } catch {
    return { ...EMPTY_SCRATCH };
  }
}

export function saveScratchStats(stats) {
  if (!canUseStorage()) return stats;
  try {
    window.localStorage.setItem(SCRATCH_KEY, JSON.stringify(stats));
  } catch {
    /* 저장 실패해도 게임은 계속 되어야 한다. */
  }
  return stats;
}
