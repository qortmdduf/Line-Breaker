// main.js — Phaser 게임 초기화
// 모든 씬 클래스가 window.* 에 등록된 후에 실행되어야 한다
// index.html에서 가장 마지막 <script>로 로드된다

const phaserConfig = {
  type: Phaser.AUTO,
  width: window.GameConfig.GAME_WIDTH,
  height: window.GameConfig.GAME_HEIGHT,
  backgroundColor: '#0d1b2a',
  scene: [
    window.BootScene,
    window.MainMenuScene,
    window.LobbyScene,
    window.BattleScene,
    window.UpgradeScene,
    window.ResultScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 가로 모드 고정 — 모바일에서 세로 회전 방지
    orientation: Phaser.Scale.LANDSCAPE,
  },
  // 물리 엔진 비활성화 — 거리 체크는 직접 구현
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
};

// Phaser 인스턴스 생성
const game = new Phaser.Game(phaserConfig);
