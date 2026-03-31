// units.js — 유닛 스탯 데이터
// window.UNITS 로 전역 접근

window.UNITS = {
  warrior: {
    id: 'warrior',
    name: '전사',
    hp: 50,
    atk: 10,
    spd: 60,
    cost: 5,
    range: 30,  // 근접: 두 유닛 반지름 합산(~27) 기준 밀착 거리
    atkSpd: 1000,    // ms
    radius: 12,
    unlocked: true,  // 기본 해금
    killCostReward: 5,
  },
  archer: {
    id: 'archer',
    name: '궁수',
    hp: 32,
    atk: 16,
    spd: 55,
    cost: 8,
    range: 72,  // 전사 지름(24) × 3 = 72 (고정값 — 전사 크기가 바뀌어도 변경 금지)
    atkSpd: 1500,
    radius: 10,
    unlocked: true,
    killCostReward: 5,
  },
  knight: {
    id: 'knight',
    name: '기사',
    hp: 130,
    atk: 20,
    spd: 80,
    cost: 20,
    range: 30,  // 근접
    atkSpd: 1200,
    radius: 15,
    unlocked: false, // 해금 필요
    killCostReward: 5,
  },
  mage: {
    id: 'mage',
    name: '마법사',
    hp: 40,
    atk: 26,
    spd: 45,
    cost: 15,
    range: 50,  // 궁수(72) × 0.7 = 50
    atkSpd: 2000,
    radius: 11,
    splashRadius: 80,
    unlocked: false,
    killCostReward: 5,
  },
  hero: {
    id: 'hero',
    name: '영웅',
    hp: 500,
    atk: 60,
    spd: 70,
    cost: 100,
    range: 50,
    atkSpd: 800,
    radius: 18,
    unlocked: false,
    isHero: true,    // 스테이지당 1회 사용
    killCostReward: 10,
  },
  elite: {
    id: 'elite',
    name: '정예병',
    hp: 190,
    atk: 22,
    spd: 40,
    cost: 0,
    range: 55,
    atkSpd: 1000,
    radius: 20,
    isElite: true,
    killCostReward: 8,
  },
  shielder: {
    id: 'shielder',
    name: '방패병',
    hp: 150,
    atk: 0,
    spd: 45,
    cost: 10,
    range: 30,  // 근접
    atkSpd: 9999,
    radius: 14,
    unlocked: false,
    isShielder: true,
    knockbackImmune: true,
    killCostReward: 5,
  },
  paladin: {
    id: 'paladin',
    name: '성기사',
    hp: 130,
    atk: 15,
    spd: 60,
    cost: 30,
    range: 30,  // 근접
    atkSpd: 1300,
    radius: 16,
    unlocked: false,
    isPaladin: true,
    auraRadius: 100,
    killCostReward: 5,
  },
  serpent_mage: {
    id: 'serpent_mage',
    name: '뱀 마법사',
    hp: 55,
    atk: 70,
    spd: 42,
    cost: 40,
    range: 144, // 궁수(72) × 2 = 144
    atkSpd: 1800,
    radius: 13,
    splashRadius: 100,
    unlocked: false,
    killCostReward: 5,
  },
};

// EVOLVED_UNITS — 레벨 10 업그레이드 달성 시 사용할 진화 유닛 스탯
// 특수 능력 속성(damageReduction, auraSpeedBonus 등)은 설계 목적으로 정의되며
// 실제 게임 동작은 AllyUnit/Hero 등 엔티티 클래스에서 별도 구현 예정.
window.EVOLVED_UNITS = {
  warrior: {
    id: 'warrior',
    name: '광전사',
    hp: 150, atk: 35, spd: 65,
    cost: 5, range: 30, atkSpd: 800, radius: 14,
    killCostReward: 5,
    // 특수: 분노 축적(미구현) — 향후 AllyUnit에서 처리
  },
  archer: {
    id: 'archer',
    name: '레인저',
    hp: 90, atk: 55, spd: 65,
    cost: 8, range: 100, atkSpd: 1000, radius: 10,
    killCostReward: 5,
    // 특수: 관통 화살(미구현) — 향후 AllyUnit에서 처리
  },
  knight: {
    id: 'knight',
    name: '철갑 기사',
    hp: 450, atk: 55, spd: 80,
    cost: 20, range: 30, atkSpd: 1200, radius: 17,
    killCostReward: 5,
    damageReduction: 0.25,  // 피해 25% 감소 — 향후 Unit.takeDamage에서 처리
  },
  mage: {
    id: 'mage',
    name: '대마법사',
    hp: 110, atk: 90, spd: 45,
    cost: 15, range: 50, atkSpd: 1500, radius: 11,
    splashRadius: 130,
    killCostReward: 5,
    // 특수: 화염 지속 피해 강화(미구현) — 향후 AllyUnit에서 처리
  },
  hero: {
    id: 'hero',
    name: '팔라딘',
    hp: 800, atk: 90, spd: 70,
    cost: 100, range: 50, atkSpd: 800, radius: 18,
    isHero: true,
    killCostReward: 10,
    auraRadius: 160,            // 기존 Hero 오라 반경보다 확대 — 향후 Hero._applyAura에서 처리
    auraSpeedBonus: 0.20,       // 이동속도 +20% — 향후 Hero._applyAura에서 처리
    auraDmgReduction: 0.30,     // 피해 감소 오라 강화 — 향후 Hero._applyAura에서 처리
    auraAtkBonus: 0.60,         // 공격력 오라 강화 — 향후 Hero._applyAura에서 처리
  },
};

// 구세이브 키(unitId_hp, unitId_atk)를 신키(unitId)로 변환하는 내부 헬퍼
function _migrateUpgradeLevel(unitId, upgrades) {
  if (!upgrades) return 0;
  // 신키가 이미 있으면 그대로 사용
  if (upgrades[unitId] !== undefined) return upgrades[unitId];
  // 구키 존재 시 두 레벨 평균으로 변환 (최대 5 제한)
  const hpLv  = upgrades[unitId + '_hp']  || 0;
  const atkLv = upgrades[unitId + '_atk'] || 0;
  return Math.min(5, Math.round((hpLv + atkLv) / 2));
}

// 업그레이드 적용 후 실제 스탯을 반환하는 헬퍼
// SaveSystem은 이 함수보다 나중에 로드되므로 직접 참조하지 않고 인자로 받는다
window.getUnitStats = function(unitId, upgrades) {
  const base = window.UNITS[unitId];
  if (!base) return null;

  const level = _migrateUpgradeLevel(unitId, upgrades);
  const maxLevel = (window.UPGRADES[unitId] && window.UPGRADES[unitId].maxLevel) || 10;

  // 레벨 10 진화: EVOLVED_UNITS에서 스탯 사용
  if (level >= maxLevel && window.EVOLVED_UNITS && window.EVOLVED_UNITS[unitId]) {
    return Object.assign({}, window.EVOLVED_UNITS[unitId]);
  }

  // 일반 업그레이드: 레벨당 HP +10%, ATK +15%
  const stats = Object.assign({}, base);
  stats.hp  = Math.floor(stats.hp  * (1 + level * 0.10));
  stats.atk = Math.floor(stats.atk * (1 + level * 0.15));
  return stats;
};
