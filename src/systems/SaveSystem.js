// SaveSystem.js — localStorage 기반 세이브/로드
// window.SaveSystem 으로 전역 접근

window.SaveSystem = (function() {
  const SAVE_KEY = 'defense_save';

  const DEFAULT_SAVE = {
    gold: 10000, // [TEST] 업그레이드 테스트용
    clearedStages: [],
    unlockedUnits: ['warrior', 'archer'],
    upgrades: {},
    heroUsed: false,
  };

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      const merged = Object.assign({}, DEFAULT_SAVE, parsed);
      merged.gold = 10000; // [TEST] 강제 적용 — 기존 세이브 무관
      return merged;
    } catch (e) {
      console.warn('[SaveSystem] 세이브 로드 실패, 기본값 사용:', e);
      return Object.assign({}, DEFAULT_SAVE);
    }
  }

  function save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[SaveSystem] 세이브 저장 실패:', e);
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    return Object.assign({}, DEFAULT_SAVE);
  }

  // 현재 세이브 데이터 (싱글턴, 메모리 캐시)
  let _cache = null;

  function get() {
    if (!_cache) _cache = load();
    return _cache;
  }

  function persist() {
    if (_cache) save(_cache);
  }

  // 전투 시작 시 영웅 사용 여부 초기화
  function resetHeroUsed() {
    get().heroUsed = false;
    persist();
  }

  return { get, persist, reset, resetHeroUsed };
})();
