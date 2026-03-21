// LobbyScene.js — 스테이지 선택 로비

class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;
    const save = window.SaveSystem.get();

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1b2a);
    bg.fillRect(0, 0, W, H);

    // 상단 헤더
    const header = this.add.graphics();
    header.fillStyle(0x1a2a40);
    header.fillRect(0, 0, W, 70);

    this.add.text(W / 2, 20, 'STAGE SELECT', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // 골드 표시
    this._goldText = this.add.text(W - 12, 22, '💰 ' + window.CurrencySystem.getGold() + ' G', {
      fontSize: '16px', color: '#ffd700'
    }).setOrigin(1, 0);

    // 스테이지 버튼
    const stages = window.STAGES;
    const startY = 130;
    const gap = 100;

    stages.forEach((stage, i) => {
      const cleared = save.clearedStages.includes(stage.id);
      // 스테이지 1은 항상 해금, 나머지는 이전 스테이지 클리어 시
      const unlocked = stage.id === 1 || save.clearedStages.includes(stage.id - 1);
      const y = startY + i * gap;

      window.LobbyUI.makeStageButton(
        this, stage, unlocked, cleared,
        W / 2, y,
        () => {
          if (unlocked) {
            this.scene.start('BattleScene', { stageId: stage.id });
          }
        }
      );
    });

    // 업그레이드 버튼 (하단)
    this._makeUpgradeButton(W / 2, H - 60);
  }

  _makeUpgradeButton(x, y) {
    const bw = 200, bh = 52;
    const bg = this.add.graphics();
    bg.fillStyle(0x445500);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);

    this.add.text(x, y, '⚒ 업그레이드', {
      fontSize: '18px', color: '#ffdd88', fontStyle: 'bold'
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, bw, bh)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      this.scene.start('UpgradeScene');
    });
  }
}

window.LobbyScene = LobbyScene;
