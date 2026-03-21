// LobbyUI.js — 로비 씬 UI 헬퍼
// LobbyScene 내부에서 사용하는 UI 빌더 모음
// 씬 로직과 UI 생성을 분리하기 위해 별도 파일로 관리

window.LobbyUI = {
  /**
   * 스테이지 버튼 하나를 생성하고 반환
   * @param {Phaser.Scene} scene
   * @param {object} stageData
   * @param {boolean} unlocked
   * @param {boolean} cleared
   * @param {number} x
   * @param {number} y
   * @param {function} onClick
   */
  makeStageButton(scene, stageData, unlocked, cleared, x, y, onClick) {
    const cfg = window.GameConfig;
    const bw = 300, bh = 60;
    const bx = x - bw / 2;

    const bgColor = unlocked ? cfg.COLOR.BUTTON_NORMAL : cfg.COLOR.BUTTON_DISABLED;
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor);
    bg.fillRoundedRect(bx, y - bh / 2, bw, bh, 10);

    const label = cleared
      ? stageData.label + '  ★ CLEAR'
      : (unlocked ? stageData.label : stageData.label + '  🔒');

    const text = scene.add.text(x, y, label, {
      fontSize: '18px',
      color: unlocked ? '#ffffff' : '#666666',
      align: 'center',
    }).setOrigin(0.5);

    const rewardText = scene.add.text(x, y + 20, '보상: ' + stageData.reward + ' Gold', {
      fontSize: '12px',
      color: unlocked ? '#ffdd88' : '#444444',
    }).setOrigin(0.5);

    if (unlocked) {
      const hitZone = scene.add.zone(x, y, bw, bh)
        .setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', onClick);
    }

    return { bg, text, rewardText };
  },
};
