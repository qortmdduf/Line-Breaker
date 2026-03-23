// config.js — 전역 상수
// 모든 씬, 시스템에서 window.GameConfig로 접근

window.GameConfig = {
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,
  WORLD_WIDTH: 1200,        // 게임 월드 전체 너비 (카메라 스크롤 범위)

  // 코스트 시스템
  COST_MAX: 150,
  COST_REGEN_RATE: 10,      // 초당 10 코스트 (약 15초에 가득 참)

  // 성 HP
  CASTLE_HP_ALLY: 1000,

  // 성 화살 기본값
  ARROW_BASE_DAMAGE: 20,
  ARROW_INTERVAL: 3000,     // ms
  ARROW_PROJ_SPEED: 600,    // px/s (포물선 발사 초속)
  ARROW_GRAVITY: 600,       // px/s² (중력 가속도)
  ARROW_ANGLE: 30,          // 기본 발사 각도 (도)
  ARROW_ANGLE_MIN: 5,       // 최소 각도 (성 바로 앞)
  ARROW_ANGLE_MAX: 45,      // 최대 각도 (가장 멀리, 상대 성 미도달 보장)

  // 전투 레이아웃
  ALLY_CASTLE_X: 60,
  ENEMY_CASTLE_X: 1140,     // 4배 거리 (기존 270px 간격 → 1080px)
  BATTLE_Y: 540,            // 유닛 이동 라인 Y 좌표

  // 자동 병사 소환 (aralias 성에서 자동 warrior 출현)
  AUTO_SPAWN_INTERVAL: 6000, // ms (적 웨이브보다 느림 → 기본적으로 밀림)

  // UI
  HUD_HEIGHT: 170,          // 화살표 버튼 행 추가로 증가

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
