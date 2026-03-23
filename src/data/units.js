// units.js — 유닛 스탯 데이터
// window.UNITS 로 전역 접근

window.UNITS = {
  warrior: {
    id: 'warrior',
    name: '전사',
    hp: 80,
    atk: 15,
    spd: 60,
    cost: 2,
    range: 40,
    atkSpd: 1000,    // ms
    radius: 12,
    unlocked: true,  // 기본 해금
  },
  archer: {
    id: 'archer',
    name: '궁수',
    hp: 50,
    atk: 25,
    spd: 55,
    cost: 3,
    range: 150,
    atkSpd: 1500,
    radius: 10,
    unlocked: true,
  },
  knight: {
    id: 'knight',
    name: '기사',
    hp: 200,
    atk: 20,
    spd: 40,
    cost: 4,
    range: 45,
    atkSpd: 1200,
    radius: 15,
    unlocked: false, // 해금 필요
  },
  mage: {
    id: 'mage',
    name: '마법사',
    hp: 60,
    atk: 40,
    spd: 45,
    cost: 5,
    range: 180,
    atkSpd: 2000,
    radius: 11,
    unlocked: false,
  },
  hero: {
    id: 'hero',
    name: '영웅',
    hp: 500,
    atk: 60,
    spd: 70,
    cost: 150,  // 에너지 최대치 = 풀 충전 필요
    range: 50,
    atkSpd: 800,
    radius: 18,
    unlocked: false,
    isHero: true,    // 스테이지당 1회 사용
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
