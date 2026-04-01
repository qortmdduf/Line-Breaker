// Round 6: 네트워크/환경 장애 — localStorage 실패 시 동작

// SaveSystem.persist() 내부에서 localStorage.setItem이 QuotaExceededError 던질 때
// _doUpgrade는 어떻게 동작하나?

// SaveSystem 시뮬레이션
let _cache = null;
let _storageWorking = true;

const SaveSystem = {
  get() {
    if (!_cache) {
      _cache = {
        gold: 0, clearedStages: [],
        unlockedUnits: ['warrior', 'archer'],
        upgrades: {}, heroUsed: false,
      };
    }
    return _cache;
  },
  persist() {
    try {
      if (!_storageWorking) throw new Error('QuotaExceededError: storage full');
      // 정상 저장
    } catch(e) {
      console.error('[SaveSystem] 세이브 저장 실패:', e.message);
      // 오류를 throw하지 않고 catch만 함 → _doUpgrade에 영향 없음
    }
  }
};

const UPGRADES = {
  warrior: { label: '전사', base: 35, maxLevel: 10, evolutionName: '광전사' },
};

function calcUpgradeCost(key, level) {
  return Math.floor(35 * Math.pow(1.5, level));
}

let mockGold = 100;
const CurrencySystem = {
  spendGold(cost) {
    if (mockGold < cost) return false;
    mockGold -= cost;
    return true;
  }
};

function _migrateLevel(save, key) {
  const upgrades = save.upgrades || {};
  if (upgrades[key] !== undefined) return upgrades[key];
  return 0;
}

function _doUpgrade(key) {
  const save = SaveSystem.get();
  const upg = UPGRADES[key];
  const currentLevel = _migrateLevel(save, key);
  if (currentLevel >= upg.maxLevel) return 'MAXED';
  const cost = calcUpgradeCost(key, currentLevel);
  if (!CurrencySystem.spendGold(cost)) return 'NO_GOLD';
  save.upgrades[key] = currentLevel + 1;
  SaveSystem.persist();
  return `SUCCESS: ${currentLevel} → ${save.upgrades[key]}, gold=${mockGold}`;
}

// 케이스 1: 정상 동작
console.log('--- 정상 저장 ---');
console.log(_doUpgrade('warrior'));

// 케이스 2: localStorage 실패 시 (persist 내에서 에러 catch)
_storageWorking = false;
console.log('\n--- localStorage 실패 시 ---');
const result = _doUpgrade('warrior');
console.log(result);
// persist()가 에러를 삼켜서 _doUpgrade는 SUCCESS를 반환함
// 메모리상 save는 업데이트되었지만 localStorage에는 저장 안됨
// → 게임 재시작 시 롤백됨 (유실)
console.log('주의: persist 실패 시 메모리에는 반영되나 재시작 시 유실됨');
console.log('in-memory level:', SaveSystem.get().upgrades.warrior);
console.log('gold spent:', 100 - mockGold, '하지만 저장 안됨 → 재시작 시 gold 복구 안됨');

// 케이스 3: persist 실패가 외부로 throw되는지 확인
_storageWorking = false;
let threw = false;
try {
  SaveSystem.persist();
} catch(e) {
  threw = true;
  console.log('persist threw:', e.message);
}
console.log('\npersist throw 여부:', threw, '(false = catch 내부에서 삼킴)');
