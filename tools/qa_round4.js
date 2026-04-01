// Round 4: 악의적 입력 — localStorage 조작으로 업그레이드 우회

// SaveSystem 시뮬레이션
function makeSave(raw) {
  const DEFAULT_SAVE = {
    gold: 0, clearedStages: [],
    unlockedUnits: ['warrior', 'archer'],
    upgrades: {}, heroUsed: false,
  };
  try {
    if (!raw) return Object.assign({}, DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_SAVE, parsed);
  } catch(e) {
    return Object.assign({}, DEFAULT_SAVE);
  }
}

// _doUpgrade 시뮬레이션
function _migrateLevel(save, key) {
  const upgrades = save.upgrades || {};
  if (upgrades[key] !== undefined) return upgrades[key];
  const hpLv  = upgrades[key + '_hp']  || 0;
  const atkLv = upgrades[key + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

const UPGRADES = {
  warrior: { label: '전사', base: 35, maxLevel: 10, requireUnit: 'warrior', evolutionName: '광전사' },
  arrow_dmg: { label: '성 화살 피해', base: 80, maxLevel: 5, requireUnit: null },
};

function calcUpgradeCost(key, currentLevel) {
  const upg = UPGRADES[key];
  if (!upg) return 9999;
  return Math.floor(upg.base * Math.pow(1.5, currentLevel));
}

function _doUpgrade(saveRaw, goldOverride, key) {
  const save = makeSave(saveRaw);
  save.gold = goldOverride; // CurrencySystem에서 관리하지만 시뮬레이션상 gold를 save에 주입
  const upg = UPGRADES[key];
  if (!upg) return { result: 'KEY_NOT_FOUND' };
  const currentLevel = _migrateLevel(save, key);
  if (currentLevel >= upg.maxLevel) return { result: 'ALREADY_MAXED', currentLevel };
  const cost = calcUpgradeCost(key, currentLevel);
  if (save.gold < cost) return { result: 'INSUFFICIENT_GOLD', gold: save.gold, cost };
  save.upgrades[key] = currentLevel + 1;
  return { result: 'SUCCESS', newLevel: save.upgrades[key] };
}

// 케이스 1: upgrades.warrior=999 주입 (비정상 높은 레벨)
// → _doUpgrade에서 currentLevel=999 >= maxLevel=10 → ALREADY_MAXED
console.log('inject lv999:', JSON.stringify(_doUpgrade(
  JSON.stringify({ upgrades: { warrior: 999 }, gold: 9999 }), 9999, 'warrior'
)));

// 케이스 2: gold=Infinity 주입
console.log('inject gold Infinity:', JSON.stringify(_doUpgrade(
  JSON.stringify({ upgrades: { warrior: 0 } }), Infinity, 'warrior'
)));

// 케이스 3: upgrades.warrior='999' (문자열 레벨)
// → 비교: '999' >= 10 → true (JS 타입 강제 변환)
const s3 = makeSave(JSON.stringify({ upgrades: { warrior: '999' } }));
const lv3 = _migrateLevel(s3, 'warrior');
console.log('string level 999:', JSON.stringify({
  level: lv3, type: typeof lv3, gte10: lv3 >= 10
}));

// 케이스 4: upgrades.warrior=null
const s4 = makeSave(JSON.stringify({ upgrades: { warrior: null } }));
const lv4 = _migrateLevel(s4, 'warrior');
console.log('null level:', JSON.stringify({
  level: lv4, type: typeof lv4, gte10: lv4 >= 10
}));
// null !== undefined → returns null → null >= 10 = false → 비정상적으로 upgrade 가능

// 케이스 5: unlockedUnits에 'hero' 주입 없이 hero 업그레이드 시도
// UpgradeScene에서는 requireUnit 필터가 있지만 _doUpgrade 자체에는 검증 없음
// 악의적 사용자가 JS 콘솔에서 직접 _doUpgrade('hero') 호출 가능 여부
console.log('hero upg without unlock (client-side, no server guard):', '허용됨 — 클라이언트 게임이므로 허용 범위');

// 케이스 6: JSON 파싱 실패 (손상된 localStorage)
const corruptSave = makeSave('{corrupted data}');
console.log('corrupt save → defaults:', JSON.stringify({
  gold: corruptSave.gold,
  upgrades: corruptSave.upgrades,
  unlockedUnits: corruptSave.unlockedUnits
}));

// 케이스 7: upgrades.warrior=false
const s7 = makeSave(JSON.stringify({ upgrades: { warrior: false } }));
const lv7 = _migrateLevel(s7, 'warrior');
console.log('boolean false level:', JSON.stringify({
  level: lv7, type: typeof lv7, gte10: lv7 >= 10
}));
// false !== undefined → returns false → false >= 10 = false → upgrade 가능

// 케이스 8: upgrades.arrow_dmg=-1 (음수 레벨)
const s8 = makeSave(JSON.stringify({ upgrades: { arrow_dmg: -1 } }));
const lv8 = _migrateLevel(s8, 'arrow_dmg');
const cost8 = calcUpgradeCost('arrow_dmg', lv8);
console.log('negative arrow_dmg level:', JSON.stringify({
  level: lv8, cost: cost8, note: '음수 pow → 매우 낮은 비용'
}));
