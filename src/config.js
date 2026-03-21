// config.js — 전역 상수
// 모든 씬, 시스템에서 window.GameConfig로 접근

window.GameConfig = {
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,

  // 코스트 시스템
  COST_MAX: 10,
  COST_REGEN_RATE: 1,       // 초당 1 코스트

  // 성 HP
  CASTLE_HP_ALLY: 1000,

  // 성 화살 기본값
  ARROW_BASE_DAMAGE: 20,
  ARROW_INTERVAL: 3000,     // ms

  // 전투 레이아웃
  ALLY_CASTLE_X: 60,
  ENEMY_CASTLE_X: 330,
  BATTLE_Y: 540,            // 유닛 이동 라인 Y 좌표

  // UI
  HUD_HEIGHT: 140,

  // 색상 팔레트
  COLOR: {
    SKY: 0x87ceeb,
    GROUND: 0x4a7c59,
    ALLY_CASTLE: 0x2255cc,
    ENEMY_CASTLE: 0xcc2222,
    WARRIOR_ALLY: 0x8b4513,
    ARCHER_ALLY: 0x228b22,
    KNIGHT_ALLY: 0x888888,
    MAGE_ALLY: 0x9933cc,
    HERO_ALLY: 0xffd700,
    WARRIOR_ENEMY: 0xff8c00,
    ARCHER_ENEMY: 0xffff00,
    KNIGHT_ENEMY: 0x555555,
    MAGE_ENEMY: 0xff69b4,
    HP_GREEN: 0x00cc44,
    HP_RED: 0xcc0000,
    HP_BG: 0x333333,
    PROJECTILE: 0xffee44,
    HUD_BG: 0x1a1a2e,
    BUTTON_NORMAL: 0x334466,
    BUTTON_DISABLED: 0x333333,
    GOLD_TEXT: 0xffd700,
    WHITE: 0xffffff,
  },
};
