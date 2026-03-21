// ResultScene.js — 전투 결과 화면
// BattleScene이 { victory, stageId, reward } 데이터와 함께 시작한다

class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this.victory = data.victory;
    this.stageId = data.stageId;
    this.reward = data.reward || 0;
  }

  create() {
    const cfg = window.GameConfig;
    const W = cfg.GAME_WIDTH;
    const H = cfg.GAME_HEIGHT;

    // 반투명 오버레이
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, W, H);

    // 결과 패널
    const panelW = 300, panelH = 320;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(this.victory ? 0x1a3a1a : 0x3a1a1a);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, this.victory ? 0x44cc44 : 0xcc4444);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    const cx = W / 2;
    const topY = panelY + 36;

    // 결과 제목
    this.add.text(cx, topY, this.victory ? 'STAGE CLEAR!' : 'DEFEAT', {
      fontSize: '30px',
      color: this.victory ? '#44ff44' : '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.victory) {
      // 클리어 스테이지
      this.add.text(cx, topY + 52, window.STAGES[this.stageId - 1].label + ' 클리어', {
        fontSize: '16px', color: '#ffffff'
      }).setOrigin(0.5);

      // 획득 골드
      this.add.text(cx, topY + 88, '획득 Gold: ' + this.reward + ' G', {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5);

      // 현재 총 골드
      this.add.text(cx, topY + 120, '보유 Gold: ' + window.CurrencySystem.getGold() + ' G', {
        fontSize: '15px', color: '#ffdd88'
      }).setOrigin(0.5);

      // 로비로 버튼
      this._makeButton(cx, topY + 186, '로비로', 0x225522, () => {
        this.scene.start('LobbyScene');
      });
    } else {
      // 패배 메시지
      this.add.text(cx, topY + 60, '성이 함락되었습니다...', {
        fontSize: '15px', color: '#ccaaaa'
      }).setOrigin(0.5);

      // 재시도 버튼
      this._makeButton(cx, topY + 130, '재시도', 0x553311, () => {
        this.scene.start('BattleScene', { stageId: this.stageId });
      });

      // 로비로 버튼
      this._makeButton(cx, topY + 196, '로비로', 0x333355, () => {
        this.scene.start('LobbyScene');
      });
    }
  }

  _makeButton(x, y, label, color, onClick) {
    const bw = 180, bh = 48;
    const bg = this.add.graphics();
    bg.fillStyle(color);
    bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 10);

    this.add.text(x, y, label, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, bw, bh)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);
  }
}

window.ResultScene = ResultScene;
