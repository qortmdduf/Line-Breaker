// Round 3: 잘못된 입력 — 존재하지 않는 key, null/undefined 처리

const UPGRADES = {
  warrior: { label: '전사', base: 35, maxLevel: 10, requireUnit: 'warrior', evolutionName: '광전사 (Berserker)' },
  arrow_dmg: { label: '성 화살 피해', base: 80, maxLevel: 5, requireUnit: null },
};

function calcUpgradeCost(key, currentLevel) {
  const upg = UPGRADES[key];
  if (!upg) return 9999;
  return Math.floor(upg.base * Math.pow(1.5, currentLevel));
}

function _migrateLevel(save, key) {
  const upgrades = save.upgrades || {};
  if (upgrades[key] !== undefined) return upgrades[key];
  const hpLv  = upgrades[key + '_hp']  || 0;
  const atkLv = upgrades[key + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

// 테스트: 존재하지 않는 키 — _upgradeRowHTML이 window.UPGRADES[key]를 접근할 때 undefined면 크래시
// UpgradeScene에서 _upgradeRowHTML('nonexistent', save, gold)를 호출하면?
function simulateUpgradeRowHTML(key, save, gold) {
  const upg = UPGRADES[key]; // undefined면 TypeError
  if (!upg) {
    return { error: `UPGRADES['${key}'] is undefined — TypeError 발생 가능` };
  }
  const currentLevel = _migrateLevel(save, key);
  const maxLevel = upg.maxLevel;
  const cost = calcUpgradeCost(key, currentLevel);
  const maxed = currentLevel >= maxLevel;
  const canBuy = !maxed && gold >= cost;
  const btnText = maxed ? (upg.evolutionName ? '진화!' : 'MAX') : (cost + 'G');
  return { key, currentLevel, maxed, canBuy, btnText };
}

// 케이스 1: 존재하지 않는 키
console.log('nonexistent key:', JSON.stringify(simulateUpgradeRowHTML('nonexistent', {upgrades:{}}, 100)));

// 케이스 2: gold가 음수
console.log('negative gold:', JSON.stringify(simulateUpgradeRowHTML('warrior', {upgrades:{warrior:3}}, -999)));

// 케이스 3: gold가 NaN
console.log('NaN gold:', JSON.stringify(simulateUpgradeRowHTML('warrior', {upgrades:{warrior:3}}, NaN)));

// 케이스 4: currentLevel이 음수(비정상 저장)
console.log('negative level:', JSON.stringify(simulateUpgradeRowHTML('warrior', {upgrades:{warrior:-1}}, 999)));

// 케이스 5: currentLevel이 소수(0.7)
console.log('float level:', JSON.stringify(simulateUpgradeRowHTML('warrior', {upgrades:{warrior:0.7}}, 999)));

// 케이스 6: gold가 Infinity
console.log('Infinity gold:', JSON.stringify(simulateUpgradeRowHTML('arrow_dmg', {upgrades:{arrow_dmg:3}}, Infinity)));

// 케이스 7: save 자체가 null인 경우 — _buildHTML(null, gold) 호출 시 save.unlockedUnits 접근에서 크래시
try {
  const save = null;
  // _buildHTML 내에서 save.upgrades 접근
  const upgrades = (save || {}).upgrades;
  console.log('null save → upgrades:', upgrades);
} catch(e) {
  console.log('null save crash:', e.message);
}

// 케이스 8: unlockedUnits가 없는 save
try {
  const save = { upgrades: {} }; // unlockedUnits 없음
  // _buildHTML 내에서 save.unlockedUnits.includes(upg.requireUnit) 호출
  const result = save.unlockedUnits ? save.unlockedUnits.includes('warrior') : undefined;
  if (result === undefined) throw new Error('save.unlockedUnits is undefined — TypeError 발생');
  console.log('no unlockedUnits:', result);
} catch(e) {
  console.log('no unlockedUnits crash:', e.message);
}
