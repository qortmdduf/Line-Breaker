// Round 7: 상태 전이 — BattleScene에서 getUnitStats 호출 시그니처 확인

// BattleScene.js:423 에서 사용:
// const stats = window.getUnitStats(unitId, window.SaveSystem.get().upgrades);

// units.js getUnitStats 시그니처:
// window.getUnitStats = function(unitId, upgrades)

// 검증: 인자 2개 (unitId, upgrades 객체) — 시그니처 일치 확인

function _migrateUpgradeLevel(unitId, upgrades) {
  if (!upgrades) return 0;
  if (upgrades[unitId] !== undefined) return upgrades[unitId];
  const hpLv  = upgrades[unitId + '_hp']  || 0;
  const atkLv = upgrades[unitId + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

const UNITS = {
  warrior: { id:'warrior', name:'전사', hp:50, atk:10, spd:60, cost:5, range:30, atkSpd:1000, radius:12, killCostReward:5 },
  archer:  { id:'archer',  name:'궁수', hp:32, atk:16, spd:55, cost:8, range:72, atkSpd:1500, radius:10, killCostReward:5 },
  knight:  { id:'knight',  name:'기사', hp:130,atk:20, spd:80, cost:20,range:30, atkSpd:1200, radius:15, killCostReward:5 },
  mage:    { id:'mage',    name:'마법사',hp:40,atk:26, spd:45, cost:15,range:50, atkSpd:2000, radius:11, splashRadius:80, killCostReward:5 },
  hero:    { id:'hero',    name:'영웅', hp:500,atk:60, spd:70, cost:100,range:50,atkSpd:800, radius:18, isHero:true, killCostReward:10 },
};
const UPGRADES = {
  warrior: { maxLevel: 10 },
  archer:  { maxLevel: 10 },
  knight:  { maxLevel: 10 },
  mage:    { maxLevel: 10 },
  hero:    { maxLevel: 10 },
};
const EVOLVED_UNITS = {
  warrior: { id:'warrior', name:'광전사', hp:150, atk:35, spd:65, cost:5, range:30, atkSpd:800, radius:14, killCostReward:5 },
  hero:    { id:'hero', name:'팔라딘', hp:800, atk:90, spd:70, cost:100, range:50, atkSpd:800, radius:18, isHero:true, killCostReward:10 },
};

function getUnitStats(unitId, upgrades) {
  const base = UNITS[unitId];
  if (!base) return null;
  const level = _migrateUpgradeLevel(unitId, upgrades);
  const maxLevel = (UPGRADES[unitId] && UPGRADES[unitId].maxLevel) || 10;
  if (level >= maxLevel && EVOLVED_UNITS && EVOLVED_UNITS[unitId]) {
    return Object.assign({}, EVOLVED_UNITS[unitId]);
  }
  const stats = Object.assign({}, base);
  stats.hp  = Math.floor(stats.hp  * (1 + level * 0.10));
  stats.atk = Math.floor(stats.atk * (1 + level * 0.15));
  return stats;
}

// 케이스 1: 업그레이드 없는 새 세이브로 BattleScene 진입
const newSave = { upgrades: {} };
for (const id of ['warrior','archer','knight','mage','hero']) {
  const s = getUnitStats(id, newSave.upgrades);
  console.log(`getUnitStats('${id}', {})`, s ? `hp=${s.hp} atk=${s.atk}` : 'NULL');
}

// 케이스 2: upgrades가 null인 경우 (_migrateUpgradeLevel 에서 처리)
console.log('\nnull upgrades:');
for (const id of ['warrior','hero']) {
  const s = getUnitStats(id, null);
  console.log(`getUnitStats('${id}', null)`, s ? `hp=${s.hp} atk=${s.atk}` : 'NULL');
}

// 케이스 3: hero lv10 → EVOLVED_UNITS 반환
const evo = getUnitStats('hero', { hero: 10 });
console.log('\nhero lv10 evolved:', JSON.stringify(evo));

// 케이스 4: 존재하지 않는 unitId
const none = getUnitStats('nonexistent', {});
console.log('nonexistent unitId:', none);

// 케이스 5: BattleScene._spawnAlly에서 사용하는 stats.radius 확인
// → 진화된 warrior는 radius=14 (base는 12)
const wEvo = getUnitStats('warrior', { warrior: 10 });
console.log('\nwarrior evolved radius:', wEvo ? wEvo.radius : 'N/A', '(expected 14)');

// 케이스 6: arrow_dmg 레벨이 upgrades에 있어도 getUnitStats에는 영향 없음 확인
const withArrow = getUnitStats('warrior', { warrior: 3, arrow_dmg: 5 });
console.log('warrior lv3 with arrow_dmg=5:', JSON.stringify({ hp: withArrow.hp, atk: withArrow.atk }));
