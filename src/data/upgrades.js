// upgrades.js — 업그레이드 정의
// key: 유닛 ID와 동일
// evolutionName: 레벨 10 달성 시 표시할 진화 유닛명
// evolutionAbilities: 진화 시 추가되는 특수 능력 설명 (UI 표시용, 실제 적용은 별도 구현)

window.UPGRADES = {
  warrior: {
    label: '전사',
    base: 35,
    maxLevel: 10,
    requireUnit: 'warrior',
    evolutionName: '광전사 (Berserker)',
    evolutionAbilities: ['공격 시 분노 축적: 일정 확률로 추가 타격'],
  },
  archer: {
    label: '궁수',
    base: 42,
    maxLevel: 10,
    requireUnit: 'archer',
    evolutionName: '레인저 (Ranger)',
    evolutionAbilities: ['사거리 증가', '공격속도 향상', '관통 화살: 2명까지 동시 적중'],
  },
  knight: {
    label: '기사',
    base: 55,
    maxLevel: 10,
    requireUnit: 'knight',
    evolutionName: '철갑 기사 (Iron Knight)',
    evolutionAbilities: ['피해 25% 감소 (철갑 방어)', 'HP 대폭 증가'],
  },
  mage: {
    label: '마법사',
    base: 70,
    maxLevel: 10,
    requireUnit: 'mage',
    evolutionName: '화염술사 (Pyromancer)',
    evolutionAbilities: ['광역 공격 범위 대폭 확대', '화염 지속 피해 강화', '화염 폭발: 사망한 적에게 잔불 생성'],
  },
  hero: {
    label: '성기사 (영웅)',
    base: 100,
    maxLevel: 10,
    requireUnit: 'hero',
    evolutionName: '팔라딘 (Paladin)',
    evolutionAbilities: ['오라 범위 확대', '오라: 주변 유닛 이동속도 +20% 추가'],
  },
  shielder: {
    label: '방패병',
    base: 40,
    maxLevel: 10,
    requireUnit: 'shielder',
    evolutionName: '강철 방패병 (Iron Sentinel)',
    evolutionAbilities: ['받는 피해 35% 감소', '주변 아군 피해 감소 5% 추가 부여'],
  },
  paladin: {
    label: '성기사 (기사단)',
    base: 60,
    maxLevel: 10,
    requireUnit: 'paladin',
    evolutionName: '빛의 성기사 (Lightbringer)',
    evolutionAbilities: ['오라 범위 확대', '아군 이동속도 +15%', '공격마다 주변 아군 소량 회복'],
  },
  serpent_mage: {
    label: '뱀 마법사',
    base: 85,
    maxLevel: 10,
    requireUnit: 'serpent_mage',
    evolutionName: '코브라 술사 (Cobra Hexer)',
    evolutionAbilities: ['독 누적 공격: 피격 시 초당 피해 증가', '광역 범위 대폭 증가'],
  },
  arrow_dmg: {
    label: '성 화살 피해',
    base: 80,
    maxLevel: 5,
    requireUnit: null,
  },
  arrow_spd: {
    label: '성 화살 속도',
    base: 60,
    maxLevel: 5,
    requireUnit: null,
  },
};

// 유닛 해금 비용
window.UNLOCK_COSTS = {
  knight: 200,
  mage: 350,
  hero: 500,
  shielder: 150,
  paladin: 250,
  serpent_mage: 300,
};

// 업그레이드 비용 계산
window.calcUpgradeCost = function(key, currentLevel) {
  const upg = window.UPGRADES[key];
  if (!upg) return 9999;
  return Math.floor(upg.base * Math.pow(1.5, currentLevel));
};
