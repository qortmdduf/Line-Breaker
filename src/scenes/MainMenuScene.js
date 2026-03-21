// MainMenuScene.js — 타이틀 화면

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;

    // 배경 그라디언트 효과 (단색 + 구분선으로 대체)
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a);
    bg.fillRect(0, 0, W, H);

    // 장식용 라인
    const deco = this.add.graphics();
    deco.lineStyle(1, 0x334466, 0.5);
    for (let i = 0; i < H; i += 40) {
      deco.lineBetween(0, i, W, i);
    }

    // 타이틀 텍스트
    this.add.text(W / 2, H * 0.3, 'LINE', {
      fontSize: '52px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.3 + 58, 'BREAKER', {
      fontSize: '44px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 부제
    this.add.text(W / 2, H * 0.3 + 110, '— Tower Defense —', {
      fontSize: '16px',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // 시작 버튼
    this._makeButton(W / 2, H * 0.62, '게임 시작', 0x2255cc, () => {
      this.scene.start('LobbyScene');
    });

    // 버전 표기
    this.add.text(W - 8, H - 8, 'v1.0', {
      fontSize: '11px', color: '#446688'
    }).setOrigin(1, 1);
  }

  _makeButton(x, y, label, color, onClick) {
    const bw = 200, bh = 56;
    const bg = this.add.graphics();
    bg.fillStyle(color);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 12);

    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, bw, bh)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);

    // 호버 효과
    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3377ee);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 12);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 12);
    });
  }
}

window.MainMenuScene = MainMenuScene;
