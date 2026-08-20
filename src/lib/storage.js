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
