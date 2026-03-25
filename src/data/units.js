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
    range: 40,
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
    range: 150,
    atkSpd: 1500,
    radius: 10,
    unlocked: true,
    killCostReward: 5,
  },
  knight: {
    id: 'knight',
    name: '기사',
    hp: 130,
    atk: 13,
    spd: 40,
    cost: 20,
    range: 45,
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
    range: 180,
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
    range: 35,
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
    hp: 180,
    atk: 16,
    spd: 50,
    cost: 30,
    range: 45,
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
    range: 200,
    atkSpd: 1800,
    radius: 13,
    splashRadius: 100,
    unlocked: false,
    killCostReward: 5,
  },
};

// 업그레이드 적용 후 실제 스탯을 반환하는 헬퍼
// SaveSystem은 이 함수보다 나중에 로드되므로 직접 참조하지 않고 인자로 받는다
window.getUnitStats = function(unitId, upgrades) {
  const base = window.UNITS[unitId];
  if (!base) return null;

  const stats = Object.assign({}, base);
  const hpKey = unitId + '_hp';
  const atkKey = unitId + '_atk';

  const hpLevel = (upgrades && upgrades[hpKey]) || 0;
  const atkLevel = (upgrades && upgrades[atkKey]) || 0;

  // 업그레이드 보너스: 레벨당 HP +10%, ATK +15%
  stats.hp = Math.floor(stats.hp * (1 + hpLevel * 0.1));
  stats.atk = Math.floor(stats.atk * (1 + atkLevel * 0.15));

  return stats;
};
