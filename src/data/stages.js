// stages.js — 스테이지 데이터
// window.STAGES 로 전역 접근

window.STAGES = [
  {
    id: 1,
    enemyCastleHp: 500,
    enemyUnits: ['warrior'],
    spawnInterval: 2000,   // ms
    reward: 50,
    label: 'Stage 1',
  },
  {
    id: 2,
    enemyCastleHp: 800,
    enemyUnits: ['warrior', 'archer'],
    spawnInterval: 3500,
    reward: 80,
    label: 'Stage 2',
  },
  {
    id: 3,
    enemyCastleHp: 1200,
    enemyUnits: ['warrior', 'archer', 'knight', 'elite'],
    spawnInterval: 3000,
    reward: 120,
    label: 'Stage 3',
  },
  {
    id: 4,
    enemyCastleHp: 1800,
    enemyUnits: ['warrior', 'archer', 'knight', 'mage', 'elite'],
    spawnInterval: 2500,
    reward: 180,
    label: 'Stage 4',
  },
  {
    id: 5,
    enemyCastleHp: 2500,
    enemyUnits: ['warrior', 'archer', 'knight', 'mage', 'hero', 'elite'],
    spawnInterval: 2000,
    reward: 250,
    label: 'Stage 5',
  },
];
