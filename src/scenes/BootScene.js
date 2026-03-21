// BootScene.js — 최초 로드 씬
// 에셋이 없으므로 즉시 MainMenuScene으로 전환
// 필요한 경우 여기서 세이브 데이터 초기화 등 선행 작업 수행

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // SaveSystem 초기화 (처음 실행 시 기본값 생성)
    window.SaveSystem.get();
    this.scene.start('MainMenuScene');
  }
}

window.BootScene = BootScene;
