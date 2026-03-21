// upgrades.js — 업그레이드 트리 데이터
// window.UPGRADES 로 전역 접근

window.UPGRADES = {
  // 유닛 스탯 업그레이드 (최대 5레벨)
  warrior_hp:  { label: '전사 HP',     base: 30,  maxLevel: 5, requireUnit: 'warrior' },
  warrior_atk: { label: '전사 공격',   base: 40,  maxLevel: 5, requireUnit: 'warrior' },
  archer_hp:   { label: '궁수 HP',     base: 35,  maxLevel: 5, requireUnit: 'archer' },
  archer_atk:  { label: '궁수 공격',   base: 50,  maxLevel: 5, requireUnit: 'archer' },
  knight_hp:   { label: '기사 HP',     base: 50,  maxLevel: 5, requireUnit: 'knight' },
  knight_atk:  { label: '기사 공격',   base: 60,  maxLevel: 5, requireUnit: 'knight' },
  mage_hp:     { label: '마법사 HP',   base: 60,  maxLevel: 5, requireUnit: 'mage' },
  mage_atk:    { label: '마법사 공격', base: 80,  maxLevel: 5, requireUnit: 'mage' },
  arrow_dmg:   { label: '성 화살 피해', base: 80, maxLevel: 5, requireUnit: null },
  arrow_spd:   { label: '성 화살 속도', base: 60, maxLevel: 5, requireUnit: null },
};

// 유닛 해금 비용
window.UNLOCK_COSTS = {
  knight: 200,
  mage: 350,
  hero: 500,
};

// 업그레이드 비용 계산: base × 1.5^현재레벨
window.calcUpgradeCost = function(key, currentLevel) {
  const upg = window.UPGRADES[key];
  if (!upg) return Infinity;
  return Math.floor(upg.base * Math.pow(1.5, currentLevel));
};
