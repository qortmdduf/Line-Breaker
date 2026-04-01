// Round 2: 경계값 — _migrateLevel, nearEvo, maxed 경계

function _migrateLevel(save, key) {
  const upgrades = save.upgrades || {};
  if (upgrades[key] !== undefined) return upgrades[key];
  const hpLv  = upgrades[key + '_hp']  || 0;
  const atkLv = upgrades[key + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

const UPGRADES = {
  warrior: { label: '전사', base: 35, maxLevel: 10, requireUnit: 'warrior', evolutionName: '광전사 (Berserker)' },
  arrow_dmg: { label: '성 화살 피해', base: 80, maxLevel: 5, requireUnit: null },
};

function simulateRow(key, save, gold) {
  const upg = UPGRADES[key];
  const currentLevel = _migrateLevel(save, key);
  const maxLevel = upg.maxLevel;
  const maxed = currentLevel >= maxLevel;
  const nearEvo = !maxed && upg.evolutionName && (currentLevel === maxLevel - 1);
  const btnText = maxed ? (upg.evolutionName ? '진화!' : 'MAX') : 'COST';
  return { key, currentLevel, maxed, nearEvo: !!nearEvo, btnText };
}

// 케이스 1: warrior lv9 = maxLevel-1 → nearEvo=true
console.log('warrior lv9(nearEvo):', JSON.stringify(simulateRow('warrior', {upgrades:{warrior:9}}, 999)));
// 케이스 2: warrior lv10 = maxLevel → maxed=true
console.log('warrior lv10(maxed):', JSON.stringify(simulateRow('warrior', {upgrades:{warrior:10}}, 999)));
// 케이스 3: warrior lv11 (비정상 초과값) → maxed=true (>= 처리)
console.log('warrior lv11(over):', JSON.stringify(simulateRow('warrior', {upgrades:{warrior:11}}, 999)));
// 케이스 4: arrow_dmg lv4 = maxLevel-1 → nearEvo=false (evolutionName 없음)
console.log('arrow_dmg lv4(nearMax-1):', JSON.stringify(simulateRow('arrow_dmg', {upgrades:{arrow_dmg:4}}, 999)));
// 케이스 5: arrow_dmg lv5 = maxLevel → maxed=true, btnText=MAX
console.log('arrow_dmg lv5(maxed):', JSON.stringify(simulateRow('arrow_dmg', {upgrades:{arrow_dmg:5}}, 999)));
// 케이스 6: 구키(warrior_hp=3, warrior_atk=5) → _migrateLevel = min(5, round(4)) = 4
console.log('warrior old keys hp3+atk5:', JSON.stringify(simulateRow('warrior', {upgrades:{warrior_hp:3, warrior_atk:5}}, 999)));
// 케이스 7: upgrades 완전 비어있음 → lv0
console.log('warrior no upgrade:', JSON.stringify(simulateRow('warrior', {upgrades:{}}, 999)));
// 케이스 8: upgrades undefined → _migrateLevel 처리 확인
console.log('warrior upgrades undefined:', JSON.stringify(simulateRow('warrior', {}, 999)));
